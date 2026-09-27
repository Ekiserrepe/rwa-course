/**
 * subscription_desk.c: an always-open primary issuance desk.
 *
 * Install on the TREASURY. An approved investor pays USD to the treasury and
 * the Hook emits a payment of the asset token back at the fixed subscription
 * price. That delivery is a SEPARATE transaction, applied a ledger or two
 * later, so this is two steps, not one atomic swap like a DEX trade:
 *
 *   1. Before the USD moves, the Hook refuses anything it can see it could
 *      not honour, so an investor normally never pays without receiving:
 *        - payments in any currency other than the configured USD
 *        - partial payments (their Amount is only a maximum)
 *        - senders without an issuer-AUTHORISED token trust line, or whose
 *          line is deep-frozen, or too small for the tokens
 *        - a token the issuer has globally frozen, or charges a transfer fee on
 *        - a subscription larger than the treasury's stock NOT already
 *          promised to earlier subscriptions still in flight
 *   2. The delivery is emitted and its units are RESERVED in the Hook's state,
 *      so two subscriptions in the same ledger can't both count the same stock.
 *   3. The callback (cbak) runs once the delivery settles. Delivered: the
 *      reservation is released. Failed (the treasury's stock was sold
 *      elsewhere meanwhile, the investor's line was frozen, the payment
 *      expired…): the reservation is released and the USD is paid back.
 *      If even the refund fails, the amount owed is recorded in the Hook's
 *      state under the investor's account, for the operations team.
 *
 * XAH payments and the treasury's own outgoing transactions pass untouched.
 *
 * Install-time parameters (HookParameters):
 *   USD   40 bytes: stablecoin currency code (20) + its issuer's account ID (20)
 *   TOK   40 bytes: asset token currency code (20) + its issuer's account ID (20)
 *   PRICE  4 bytes: big-endian whole USD per token (100 = 100 USD per token)
 */
#define HAS_CALLBACK // this Hook has a cbak: emitted transactions carry a callback
#include "hookapi.h"

#define OK(msg) accept(SBUF(msg), __LINE__)
#define REJECT(msg) rollback(SBUF(msg), __LINE__)

#define tfPARTIAL_PAYMENT 0x00020000U
#define lsfLowAuth 0x00040000U
#define lsfHighAuth 0x00080000U
#define lsfLowFreeze 0x00400000U
#define lsfHighFreeze 0x00800000U
#define lsfLowDeepFreeze 0x02000000U
#define lsfHighDeepFreeze 0x04000000U
#define lsfGlobalFreeze 0x00400000U // on the issuer's AccountRoot

// Pending payment, stored under its emitted hash:
//   kind (1: 'S' delivery, 'R' refund) | investor (20) | USD paid, XFL (8) | tokens, XFL (8)
#define PENDING_SIZE 37

// Inlined on purpose: hook-cleaner keeps only hook() and cbak() and drops any other function

/** Read an 8-byte XFL from state, 0 when absent. */
static inline __attribute__((always_inline)) int64_t state_xfl(uint8_t *key, uint32_t key_len)
{
    uint8_t buf[8];
    if (state(SBUF(buf), key, key_len) != 8)
        return 0;
    return INT64_FROM_BUF(buf);
}

/** Write an 8-byte XFL to state; zero deletes the entry. */
static inline __attribute__((always_inline)) int64_t state_set_xfl(int64_t value, uint8_t *key, uint32_t key_len)
{
    if (value == 0)
        return state_set(0, 0, key, key_len);
    uint8_t out[8]; // not "buf": INT64_TO_BUF declares a variable of that name
    INT64_TO_BUF(out, value);
    return state_set(SBUF(out), key, key_len);
}

/** Emit a simple token payment of `amount` (XFL) of `cur` (code 20 + issuer 20) to `to`. 32 on success. */
static inline __attribute__((always_inline)) int64_t pay(uint8_t *cur, int64_t amount, uint8_t *to, uint8_t *hash_out)
{
    uint8_t tl_amt[49];
    if (float_sto(SBUF(tl_amt), cur, 20, cur + 20, 20, amount, sfAmount) != 49)
        return -1;
    uint8_t *raw_amt = tl_amt + 1; // skip the field id, the macro wants the bare amount
    uint8_t txn[PREPARE_PAYMENT_SIMPLE_TRUSTLINE_SIZE];
    PREPARE_PAYMENT_SIMPLE_TRUSTLINE(txn, raw_amt, to, 0, 0);
    return emit(hash_out, 32, SBUF(txn));
}

/**
 * The callback: the ledger runs it once a payment this Hook emitted has been
 * applied (what = 0), whatever its result, or has expired unapplied (what = 1).
 */
int64_t cbak(uint32_t what)
{
    uint8_t txid[32];
    otxn_id(SBUF(txid), 0); // the emitted payment's hash
    uint8_t p[PENDING_SIZE];
    if (state(SBUF(p), SBUF(txid)) != PENDING_SIZE)
        OK("Desk: callback for no pending payment.");
    state_set(0, 0, SBUF(txid));
    uint8_t *investor = p + 1, *paid_buf = p + 21, *units_buf = p + 29;
    int64_t paid = INT64_FROM_BUF(paid_buf);
    int64_t units = INT64_FROM_BUF(units_buf);

    // Delivered only if it was applied AND its result is tesSUCCESS (0)
    int delivered = 0;
    uint8_t result[1];
    if (what == 0 && meta_slot(1) == 1 && slot_subfield(1, sfTransactionResult, 2) == 2 &&
        slot(SBUF(result), 2) == 1 && result[0] == 0)
        delivered = 1;

    uint8_t usd[40];
    uint8_t usd_key[3] = {'U', 'S', 'D'};
    hook_param(SBUF(usd), SBUF(usd_key));

    if (p[0] == 'R')
    {
        if (delivered)
            OK("Desk: refund delivered.");
        // Nothing more the Hook can do: record the debt for the operations team
        int64_t owed = float_sum(state_xfl(investor, 20), paid);
        state_set_xfl(owed, investor, 20);
        OK("Desk: refund failed, amount owed recorded in state.");
    }

    // A delivery settled either way: its tokens are no longer reserved
    uint8_t res_key[8] = {'R', 'E', 'S', 'E', 'R', 'V', 'E', 'D'};
    int64_t reserved = float_sum(state_xfl(SBUF(res_key)), float_negate(units));
    if (float_compare(reserved, 0, COMPARE_LESS | COMPARE_EQUAL) == 1)
        reserved = 0;
    state_set_xfl(reserved, SBUF(res_key));
    if (delivered)
        OK("Desk: tokens delivered.");

    // Not delivered: pay the USD back, and follow that refund too
    etxn_reserve(1);
    uint8_t refund_hash[32];
    if (pay(usd, paid, investor, refund_hash) != 32)
    {
        state_set_xfl(float_sum(state_xfl(investor, 20), paid), investor, 20);
        OK("Desk: delivery failed and the refund could not be emitted; amount owed recorded.");
    }
    p[0] = 'R';
    state_set(SBUF(p), SBUF(refund_hash));
    OK("Desk: delivery failed, USD refund on the way.");
    return 0;
}

int64_t hook(uint32_t reserved)
{
    uint8_t hook_acc[20];
    hook_account(SBUF(hook_acc));

    // The treasury's own transactions (including what this Hook emits) pass
    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);
    int outgoing = 0;
    BUFFER_EQUAL(outgoing, hook_acc, sender, 20);
    if (outgoing)
        OK("Desk: outgoing, not gated.");

    if (otxn_type() != ttPAYMENT)
        OK("Desk: not a payment.");

    uint8_t amount[48];
    int64_t amount_len = otxn_field(SBUF(amount), sfAmount);
    if (amount_len == 8)
        OK("Desk: XAH received, not a subscription.");
    if (amount_len != 48)
        REJECT("Desk: unreadable amount.");

    // ── Configuration ───────────────────────────────────────────────────────
    uint8_t usd[40], tok[40], price_buf[4];
    uint8_t usd_key[3] = {'U', 'S', 'D'};
    uint8_t tok_key[3] = {'T', 'O', 'K'};
    uint8_t price_key[5] = {'P', 'R', 'I', 'C', 'E'};
    if (hook_param(SBUF(usd), SBUF(usd_key)) != 40 || hook_param(SBUF(tok), SBUF(tok_key)) != 40 ||
        hook_param(SBUF(price_buf), SBUF(price_key)) != 4)
        REJECT("Desk: misconfigured, USD, TOK and PRICE parameters are required.");
    int64_t price = ((int64_t)price_buf[0] << 24) | ((int64_t)price_buf[1] << 16) |
                    ((int64_t)price_buf[2] << 8) | (int64_t)price_buf[3];
    if (price <= 0)
        REJECT("Desk: PRICE must be above zero.");

    // ── 1. Only the configured stablecoin ───────────────────────────────────
    int is_usd = 0;
    BUFFER_EQUAL(is_usd, amount + 8, usd, 40);
    if (!is_usd)
        REJECT("Desk: subscriptions are paid in the configured USD only.");

    // ── 2. No partial payments: Amount must be what actually arrives ────────
    uint32_t flags = 0;
    uint8_t flags_buf[4];
    if (otxn_field(SBUF(flags_buf), sfFlags) == 4)
        flags = ((uint32_t)flags_buf[0] << 24) | ((uint32_t)flags_buf[1] << 16) |
                ((uint32_t)flags_buf[2] << 8) | (uint32_t)flags_buf[3];
    if (flags & tfPARTIAL_PAYMENT)
        REJECT("Desk: partial payments are refused.");

    int64_t paid = float_sto_set(amount, 8);
    int64_t units = float_divide(paid, float_set(0, price));
    if (units <= 0)
        REJECT("Desk: amount too small.");

    // ── 3. The investor must be able to receive the tokens ─────────────────
    // Trust line between the sender and the token issuer, for the token currency
    uint8_t *tok_issuer = tok + 20;
    uint8_t line_kl[34];
    if (util_keylet(SBUF(line_kl), KEYLET_LINE, SBUF(sender), tok_issuer, 20, tok, 20) != 34)
        REJECT("Desk: could not compute the trust line.");
    if (slot_set(SBUF(line_kl), 1) != 1)
        REJECT("Desk: open a trust line for the token first.");
    if (slot_subfield(1, sfFlags, 2) != 2)
        REJECT("Desk: could not read the trust line.");
    uint8_t lf[4];
    slot(SBUF(lf), 2);
    uint32_t line_flags = ((uint32_t)lf[0] << 24) | ((uint32_t)lf[1] << 16) | ((uint32_t)lf[2] << 8) | (uint32_t)lf[3];

    // The "low" account of a line is the one with the smaller account ID;
    // each side's flags and limit are its own, the balance is the low side's
    int cmp = 0;
    ACCOUNT_COMPARE(cmp, tok_issuer, sender);
    int issuer_low = cmp < 0;
    if (!(line_flags & (issuer_low ? lsfLowAuth : lsfHighAuth)))
        REJECT("Desk: your trust line is not authorised yet (KYC pending).");
    if (line_flags & (issuer_low ? lsfLowDeepFreeze : lsfHighDeepFreeze))
        REJECT("Desk: your trust line is deep-frozen and can't receive.");

    // The line's limit must leave room for the new tokens
    if (slot_subfield(1, sfBalance, 3) != 3 || slot_subfield(1, issuer_low ? sfHighLimit : sfLowLimit, 4) != 4)
        REJECT("Desk: could not read the trust line.");
    int64_t held = slot_float(3);
    if (issuer_low)
        held = float_negate(held); // the investor is the high side: flip the low side's balance
    if (float_compare(float_sum(held, units), slot_float(4), COMPARE_GREATER) == 1)
        REJECT("Desk: your trust line's limit is too low for this subscription.");

    // ── 4. The issuer lets the token move ───────────────────────────────────
    uint8_t acc_kl[34];
    if (util_keylet(SBUF(acc_kl), KEYLET_ACCOUNT, tok_issuer, 20, 0, 0, 0, 0) != 34 || slot_set(SBUF(acc_kl), 5) != 5)
        REJECT("Desk: could not read the token issuer.");
    uint8_t fb[4];
    if (slot_subfield(5, sfFlags, 6) == 6 && slot(SBUF(fb), 6) == 4 && (UINT32_FROM_BUF(fb) & lsfGlobalFreeze))
        REJECT("Desk: the token is globally frozen.");
    uint8_t rb[4];
    if (slot_subfield(5, sfTransferRate, 7) == 7 && slot(SBUF(rb), 7) == 4)
    {
        uint32_t rate = UINT32_FROM_BUF(rb);
        if (rate != 0 && rate != 1000000000U) // a fee would need a SendMax the delivery doesn't carry
            REJECT("Desk: the issuer charges a transfer fee, which the desk can't pay.");
    }

    // ── 5. Stock: the treasury's balance minus what is already promised ─────
    uint8_t tl_kl[34];
    if (util_keylet(SBUF(tl_kl), KEYLET_LINE, SBUF(hook_acc), tok_issuer, 20, tok, 20) != 34 ||
        slot_set(SBUF(tl_kl), 8) != 8 || slot_subfield(8, sfBalance, 9) != 9 || slot_subfield(8, sfFlags, 10) != 10)
        REJECT("Desk: the treasury holds no tokens.");
    uint8_t tf[4];
    slot(SBUF(tf), 10);
    if (UINT32_FROM_BUF(tf) & (issuer_low ? lsfLowFreeze : lsfHighFreeze))
        REJECT("Desk: the treasury's own line is frozen.");
    int64_t balance = slot_float(9);
    // RippleState balances are stored from the low account's side
    if (issuer_low)
        balance = float_negate(balance);
    uint8_t res_key[8] = {'R', 'E', 'S', 'E', 'R', 'V', 'E', 'D'};
    int64_t promised = state_xfl(SBUF(res_key));
    int64_t available = float_sum(balance, float_negate(promised));
    if (float_compare(units, available, COMPARE_GREATER) == 1)
        REJECT("Desk: not enough tokens left for this subscription.");

    // ── 6. Deliver, and remember it until cbak hears how it went ────────────
    etxn_reserve(1);
    uint8_t emithash[32];
    if (pay(tok, units, sender, emithash) != 32)
        REJECT("Desk: could not emit the token payment.");

    uint8_t p[PENDING_SIZE];
    p[0] = 'S';
    for (int i = 0; GUARD(20), i < 20; ++i) p[1 + i] = sender[i];
    uint8_t *paid_buf = p + 21, *units_buf = p + 29;
    INT64_TO_BUF(paid_buf, paid);
    INT64_TO_BUF(units_buf, units);
    if (state_set(SBUF(p), SBUF(emithash)) != PENDING_SIZE ||
        state_set_xfl(float_sum(promised, units), SBUF(res_key)) < 0)
        REJECT("Desk: could not record the subscription.");

    OK("Desk: subscription accepted, tokens on the way.");
    return 0;
}
