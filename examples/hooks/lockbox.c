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
 *            beneficiary and deletes the lock. Too early: refused.
 *
 *   Void     The token's issuer sends an Invoke with ID and OP = "VOID": the
 *            lock is deleted without paying anyone. Used after the issuer has
 *            clawed the locked tokens back from the vault.
 *
 * The vault's own transactions are refused unless this Hook emitted them (or
 * they only move XAH), so nobody holding the vault's key can spend locked
 * tokens without first removing the Hook. For a lock investors can rely on,
 * put the vault's key out of reach once the Hook is installed.
 *
 * Install-time parameter (HookParameters):
 *   TOK  40 bytes: token currency code (20) + its issuer's account ID (20)
 */
#include "hookapi.h"

// Missing from the bundled headers: read a parameter of the triggering transaction
extern int64_t otxn_param(uint32_t write_ptr, uint32_t write_len, uint32_t read_ptr, uint32_t read_len);

#define OK(msg) accept(SBUF(msg), __LINE__)
#define REJECT(msg) rollback(SBUF(msg), __LINE__)

#define ttINVOKE 99
#define tfPARTIAL_PAYMENT 0x00020000U
#define lsfLowAuth 0x00040000U
#define lsfHighAuth 0x00080000U

// A lock: owner (20) | beneficiary (20) | amount as XFL (8) | release time (4)
#define LOCK_SIZE 52

/** 1 if `acc` has a trust line for the token that the issuer has authorised. */
// Inlined on purpose: hook-cleaner keeps only hook() and drops any other function
static inline __attribute__((always_inline)) int authorised(uint8_t *acc, uint8_t *tok)
{
    uint8_t *issuer = tok + 20;
    uint8_t kl[34];
    if (util_keylet(SBUF(kl), KEYLET_LINE, acc, 20, issuer, 20, tok, 20) != 34 ||
        slot_set(SBUF(kl), 1) != 1 || slot_subfield(1, sfFlags, 2) != 2)
        return 0;
    uint8_t lf[4];
    slot(SBUF(lf), 2);
    uint32_t flags = UINT32_FROM_BUF(lf);
    int cmp = 0;
    ACCOUNT_COMPARE(cmp, issuer, acc); // the "low" account has the smaller ID
    return (flags & (cmp < 0 ? lsfLowAuth : lsfHighAuth)) != 0;
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
        if (!authorised(ben, tok))
            REJECT("Lock: the beneficiary has no authorised trust line for the token.");

        uint8_t lock[LOCK_SIZE];
        for (int i = 0; GUARD(20), i < 20; ++i) lock[i] = sender[i];
        for (int i = 0; GUARD(20), i < 20; ++i) lock[20 + i] = ben[i];
        int64_t amount = float_sto_set(amt, 8);
        uint8_t *amount_buf = lock + 40, *after_out = lock + 48;
        INT64_TO_BUF(amount_buf, amount);
        UINT32_TO_BUF(after_out, after);

        uint8_t id[32];
        otxn_id(SBUF(id), 0);
        if (state_set(SBUF(lock), SBUF(id)) != LOCK_SIZE)
            REJECT("Lock: could not record the lock.");
        OK("Lock: tokens locked.");
    }

    if (tt != ttINVOKE)
        OK("Lock: not a payment or an invoke.");

    // ── Release or void: an Invoke naming a lock ────────────────────────────
    uint8_t id[32];
    uint8_t id_key[2] = {'I', 'D'};
    if (otxn_param(SBUF(id), SBUF(id_key)) != 32)
        REJECT("Lock: which lock? Pass its ID.");
    uint8_t lock[LOCK_SIZE];
    if (state(SBUF(lock), SBUF(id)) != LOCK_SIZE)
        REJECT("Lock: no such lock, or it was already released or voided.");

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
    if (!authorised(ben, tok))
        REJECT("Lock: the beneficiary's trust line is not authorised.");

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
    if (state_set(0, 0, SBUF(id)) < 0)
        REJECT("Lock: could not delete the lock.");

    OK("Lock: released, tokens on the way.");
    return 0;
}
