/**
 * lockbox.c: time locks for a token whose issuer can claw back.
 *
 * Xahau refuses to escrow a token whose issuer has clawback enabled. This Hook
 * gives the same guarantee another way: a dedicated VAULT account holds the
 * tokens, and the Hook on it is the only way they can leave.
 *
 *   Lock     Pay the token to the vault with two transaction HookParameters:
 *              BEN    20 bytes: who receives the tokens (account ID)
 *              AFTER   4 bytes: big-endian release time, in ledger time
 *                      (seconds since 2000-01-01)
 *            The Hook records the lock under the payment's transaction hash.
 *            Refused (before anything moves) if the parameters are missing,
 *            AFTER is not in the future, the payment is partial, or the
 *            beneficiary has no authorised trust line for the token.
 *
 *   Release  Anyone sends an Invoke to the vault with ID = the lock's hash.
 *            Once ledger time reaches AFTER, the Hook emits the payment to the
 *            beneficiary and marks the lock "releasing". Too early: refused.
 *            The emitted payment is a separate transaction that can still
 *            fail (the beneficiary's line deep-frozen or full, a global
 *            freeze). The Hook's callback (cbak) learns its result: delivered,
 *            the lock is deleted; failed, the lock goes back to "locked" and
 *            can be released again once the cause is fixed.
 *
 *   Void     The token's issuer sends an Invoke with ID and OP = "VOID": the
 *            lock is deleted without paying anyone. Used after the issuer has
 *            clawed the locked tokens back from the vault.
 *
 * Install with HookOn = every transaction type. The vault's own transactions
 * are refused unless this Hook emitted them, they only move XAH, or they only
 * manage the account's keys (AccountSet, SetRegularKey, SignerListSet). So
 * nobody holding the vault's key can spend locked tokens by any route (a
 * payment, an offer, a check, a Remit, a URIToken purchase…) without first
 * removing the Hook. For a lock investors can rely on, put the vault's key
 * out of reach once the Hook is installed.
 *
 * Install-time parameter (HookParameters):
 *   TOK  40 bytes: token currency code (20) + its issuer's account ID (20)
 */
#define HAS_CALLBACK // this Hook has a cbak: emitted transactions carry a callback
#include "hookapi.h"

// Missing from the bundled headers: read a parameter of the triggering transaction
extern int64_t otxn_param(uint32_t write_ptr, uint32_t write_len, uint32_t read_ptr, uint32_t read_len);

#define OK(msg) accept(SBUF(msg), __LINE__)
#define REJECT(msg) rollback(SBUF(msg), __LINE__)

#define ttACCOUNT_SET 3
#define ttREGULAR_KEY_SET 5
#define ttSIGNER_LIST_SET 12
#define ttINVOKE 99
#define tfPARTIAL_PAYMENT 0x00020000U
#define lsfLowAuth 0x00040000U
#define lsfHighAuth 0x00080000U
#define lsfLowFreeze 0x00400000U
#define lsfHighFreeze 0x00800000U
#define lsfLowDeepFreeze 0x02000000U
#define lsfHighDeepFreeze 0x04000000U
#define lsfGlobalFreeze 0x00400000U // on the issuer's AccountRoot

// A lock: owner (20) | beneficiary (20) | amount as XFL (8) | release time (4) | status (1)
#define LOCK_SIZE 53
#define LOCKED 0
#define RELEASING 1 // a release payment was emitted and hasn't settled yet

// Inlined on purpose: hook-cleaner keeps only hook() and cbak() and drops any other function

/** The issuer-side flags of `acc`'s line for the token: AUTH, FREEZE or DEEP. -1 if no line. */
#define AUTH 1
#define FREEZE 2
#define DEEP 4
static inline __attribute__((always_inline)) int line_state(uint8_t *acc, uint8_t *tok)
{
    uint8_t *issuer = tok + 20;
    uint8_t kl[34];
    if (util_keylet(SBUF(kl), KEYLET_LINE, acc, 20, issuer, 20, tok, 20) != 34 ||
        slot_set(SBUF(kl), 1) != 1 || slot_subfield(1, sfFlags, 2) != 2)
        return -1;
    uint8_t lf[4];
    slot(SBUF(lf), 2);
    uint32_t flags = UINT32_FROM_BUF(lf);
    int cmp = 0;
    ACCOUNT_COMPARE(cmp, issuer, acc); // the "low" account has the smaller ID
    int low = cmp < 0;                 // the issuer's own flags are on its side
    return ((flags & (low ? lsfLowAuth : lsfHighAuth)) ? AUTH : 0) |
           ((flags & (low ? lsfLowFreeze : lsfHighFreeze)) ? FREEZE : 0) |
           ((flags & (low ? lsfLowDeepFreeze : lsfHighDeepFreeze)) ? DEEP : 0);
}

/** 0 if the issuer lets the token move between holders; otherwise why not. */
static inline __attribute__((always_inline)) int issuer_blocks(uint8_t *issuer)
{
    uint8_t kl[34];
    if (util_keylet(SBUF(kl), KEYLET_ACCOUNT, issuer, 20, 0, 0, 0, 0) != 34 || slot_set(SBUF(kl), 5) != 5)
        return 1;
    uint8_t fb[4];
    if (slot_subfield(5, sfFlags, 6) == 6 && slot(SBUF(fb), 6) == 4 && (UINT32_FROM_BUF(fb) & lsfGlobalFreeze))
        return 2;
    // A transfer fee would need a SendMax, which the simple emitted payment doesn't carry
    uint8_t rb[4];
    if (slot_subfield(5, sfTransferRate, 7) == 7 && slot(SBUF(rb), 7) == 4)
    {
        uint32_t rate = UINT32_FROM_BUF(rb);
        if (rate != 0 && rate != 1000000000U)
            return 3;
    }
    return 0;
}

/**
 * The callback: the ledger runs it once a payment this Hook emitted has been
 * applied (what = 0), whatever its result, or has expired unapplied (what = 1).
 */
int64_t cbak(uint32_t what)
{
    uint8_t txid[32];
    otxn_id(SBUF(txid), 0); // the emitted payment's hash
    uint8_t id[32];
    if (state(SBUF(id), SBUF(txid)) != 32)
        OK("Lock: callback for no pending release.");
    state_set(0, 0, SBUF(txid));

    uint8_t lock[LOCK_SIZE];
    if (state(SBUF(lock), SBUF(id)) != LOCK_SIZE)
        OK("Lock: the lock no longer exists.");

    // Delivered only if it was applied AND its result is tesSUCCESS (0)
    int delivered = 0;
    uint8_t result[1];
    if (what == 0 && meta_slot(1) == 1 && slot_subfield(1, sfTransactionResult, 2) == 2 &&
        slot(SBUF(result), 2) == 1 && result[0] == 0)
        delivered = 1;

    if (delivered)
    {
        state_set(0, 0, SBUF(id));
        OK("Lock: release delivered, lock closed.");
    }
    lock[52] = LOCKED;
    state_set(SBUF(lock), SBUF(id));
    OK("Lock: release payment failed, the lock stays and can be released again.");
    return 0;
}

int64_t hook(uint32_t reserved)
{
    uint8_t vault[20];
    hook_account(SBUF(vault));

    uint8_t tok[40];
    uint8_t tok_key[3] = {'T', 'O', 'K'};
    if (hook_param(SBUF(tok), SBUF(tok_key)) != 40)
        REJECT("Lock: misconfigured, the TOK parameter is required.");
    uint8_t *issuer = tok + 20;

    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);
    int64_t tt = otxn_type();

    // ── The vault's own transactions ────────────────────────────────────────
    int own = 0;
    BUFFER_EQUAL(own, vault, sender, 20);
    if (own && tt != ttINVOKE)
    {
        uint8_t details[256];
        if (otxn_field(SBUF(details), sfEmitDetails) > 0)
            OK("Lock: release sent by this Hook.");
        uint8_t amt[48];
        if (tt == ttPAYMENT && otxn_field(SBUF(amt), sfAmount) == 8)
            OK("Lock: XAH payment, not locked.");
        if (tt == ttACCOUNT_SET || tt == ttREGULAR_KEY_SET || tt == ttSIGNER_LIST_SET)
            OK("Lock: key management, moves nothing.");
        REJECT("Lock: locked tokens leave the vault only through a release.");
    }

    // ── Lock: a token payment into the vault ────────────────────────────────
    if (tt == ttPAYMENT)
    {
        uint8_t amt[48];
        int64_t alen = otxn_field(SBUF(amt), sfAmount);
        if (alen == 8)
            OK("Lock: XAH received, for fees and reserves.");
        int is_tok = 0;
        BUFFER_EQUAL(is_tok, amt + 8, tok, 40);
        if (alen != 48 || !is_tok)
            REJECT("Lock: this vault only holds the configured token.");

        uint8_t fb[4];
        if (otxn_field(SBUF(fb), sfFlags) == 4 && (UINT32_FROM_BUF(fb) & tfPARTIAL_PAYMENT))
            REJECT("Lock: partial payments are refused.");

        uint8_t ben[20], after_buf[4];
        uint8_t ben_key[3] = {'B', 'E', 'N'};
        uint8_t after_key[5] = {'A', 'F', 'T', 'E', 'R'};
        if (otxn_param(SBUF(ben), SBUF(ben_key)) != 20 || otxn_param(SBUF(after_buf), SBUF(after_key)) != 4)
            REJECT("Lock: say who receives the tokens (BEN) and when (AFTER).");
        uint32_t after = UINT32_FROM_BUF(after_buf);
        if ((int64_t)after <= ledger_last_time())
            REJECT("Lock: AFTER must be in the future.");
        int ben_line = line_state(ben, tok);
        if (ben_line < 0 || !(ben_line & AUTH))
            REJECT("Lock: the beneficiary has no authorised trust line for the token.");
        if (issuer_blocks(issuer) == 3)
            REJECT("Lock: the issuer charges a transfer fee, which a release can't pay.");

        uint8_t lock[LOCK_SIZE];
        for (int i = 0; GUARD(20), i < 20; ++i) lock[i] = sender[i];
        for (int i = 0; GUARD(20), i < 20; ++i) lock[20 + i] = ben[i];
        int64_t amount = float_sto_set(amt, 8);
        uint8_t *amount_buf = lock + 40, *after_out = lock + 48;
        INT64_TO_BUF(amount_buf, amount);
        UINT32_TO_BUF(after_out, after);
        lock[52] = LOCKED;

        uint8_t id[32];
        otxn_id(SBUF(id), 0);
        if (state_set(SBUF(lock), SBUF(id)) != LOCK_SIZE)
            REJECT("Lock: could not record the lock.");
        OK("Lock: tokens locked.");
    }

    if (tt != ttINVOKE)
        REJECT("Lock: the vault takes only payments (to lock) and invokes (to release).");

    // ── Release or void: an Invoke naming a lock ────────────────────────────
    uint8_t id[32];
    uint8_t id_key[2] = {'I', 'D'};
    if (otxn_param(SBUF(id), SBUF(id_key)) != 32)
        REJECT("Lock: which lock? Pass its ID.");
    uint8_t lock[LOCK_SIZE];
    if (state(SBUF(lock), SBUF(id)) != LOCK_SIZE)
        REJECT("Lock: no such lock, or it was already released or voided.");
    if (lock[52] == RELEASING)
        REJECT("Lock: a release is already on its way, wait for it to settle.");

    uint8_t op[4];
    uint8_t op_key[2] = {'O', 'P'};
    if (otxn_param(SBUF(op), SBUF(op_key)) == 4 && op[0] == 'V' && op[1] == 'O' && op[2] == 'I' && op[3] == 'D')
    {
        int by_issuer = 0;
        BUFFER_EQUAL(by_issuer, sender, issuer, 20);
        if (!by_issuer)
            REJECT("Lock: only the token's issuer can void a lock.");
        if (state_set(0, 0, SBUF(id)) < 0)
            REJECT("Lock: could not delete the lock.");
        OK("Lock: voided by the issuer.");
    }

    uint8_t *ben = lock + 20, *amount_buf = lock + 40, *after_buf = lock + 48;
    int64_t amount = INT64_FROM_BUF(amount_buf);
    uint32_t after = UINT32_FROM_BUF(after_buf);
    if ((int64_t)after > ledger_last_time())
        REJECT("Lock: too early, the release time has not come.");

    // The vault must still hold the tokens: a clawback may have taken them
    uint8_t kl[34];
    if (util_keylet(SBUF(kl), KEYLET_LINE, SBUF(vault), issuer, 20, tok, 20) != 34 ||
        slot_set(SBUF(kl), 3) != 3 || slot_subfield(3, sfBalance, 4) != 4)
        REJECT("Lock: the vault holds none of the token.");
    int64_t balance = slot_float(4);
    int cmp = 0;
    ACCOUNT_COMPARE(cmp, vault, issuer);
    if (cmp > 0) // balances are stored from the low account's side
        balance = float_negate(balance);
    if (float_compare(amount, balance, COMPARE_GREATER) == 1)
        REJECT("Lock: the vault holds less than this lock (clawed back?). The issuer must void it.");
    // Everything the emitted payment needs, checked now for a clear refusal.
    // Anything that still goes wrong is caught by cbak.
    int ben_line = line_state(ben, tok);
    if (ben_line < 0 || !(ben_line & AUTH))
        REJECT("Lock: the beneficiary's trust line is not authorised.");
    if (ben_line & DEEP)
        REJECT("Lock: the beneficiary's line is deep-frozen and can't receive.");
    if (line_state(vault, tok) & FREEZE)
        REJECT("Lock: the issuer has frozen the vault's line.");
    int blocked = issuer_blocks(issuer);
    if (blocked == 2)
        REJECT("Lock: the token is globally frozen.");
    if (blocked == 3)
        REJECT("Lock: the issuer charges a transfer fee, which a release can't pay.");

    etxn_reserve(1);
    uint8_t tl_amt[49];
    if (float_sto(SBUF(tl_amt), tok, 20, issuer, 20, amount, sfAmount) != 49)
        REJECT("Lock: could not serialise the amount.");
    uint8_t *raw_amt = tl_amt + 1; // skip the field id, the macro wants the bare amount
    uint8_t txn[PREPARE_PAYMENT_SIMPLE_TRUSTLINE_SIZE];
    PREPARE_PAYMENT_SIMPLE_TRUSTLINE(txn, raw_amt, ben, 0, 0);
    uint8_t emithash[32];
    if (emit(SBUF(emithash), SBUF(txn)) != 32)
        REJECT("Lock: could not emit the release payment.");
    // Keep the lock until cbak confirms delivery; remember which payment is its release
    lock[52] = RELEASING;
    if (state_set(SBUF(lock), SBUF(id)) != LOCK_SIZE || state_set(SBUF(id), SBUF(emithash)) != 32)
        REJECT("Lock: could not record the release.");

    OK("Lock: released, tokens on the way.");
    return 0;
}
