/**
 * subscription_desk.c: an always-open primary issuance desk.
 *
 * Install on the TREASURY. An approved investor pays USD to the treasury and,
 * in the same ledger, the Hook emits a payment of the asset token back at the
 * fixed subscription price. Anything the desk cannot honour is refused BEFORE
 * the USD moves, so an investor never pays without being able to receive:
 *
 *   - payments in any currency other than the configured USD are refused
 *   - partial payments are refused (their Amount is only a maximum)
 *   - senders without an issuer-AUTHORISED token trust line are refused
 *   - a subscription larger than the treasury's remaining token balance is refused
 *
 * XAH payments and the treasury's own outgoing transactions pass untouched.
 *
 * Install-time parameters (HookParameters):
 *   USD   40 bytes: stablecoin currency code (20) + its issuer's account ID (20)
 *   TOK   40 bytes: asset token currency code (20) + its issuer's account ID (20)
 *   PRICE  4 bytes: big-endian whole USD per token (100 = 100 USD per token)
 */
#include "hookapi.h"

#define OK(msg) accept(SBUF(msg), __LINE__)
#define REJECT(msg) rollback(SBUF(msg), __LINE__)

#define tfPARTIAL_PAYMENT 0x00020000U
#define lsfLowAuth 0x00040000U
#define lsfHighAuth 0x00080000U

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

    // ── 3. The investor must be able to receive the token ──────────────────
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

    // The "low" account of a line is the one with the smaller account ID
    int cmp = 0;
    ACCOUNT_COMPARE(cmp, tok_issuer, sender);
    uint32_t issuer_auth = cmp < 0 ? lsfLowAuth : lsfHighAuth;
    if (!(line_flags & issuer_auth))
        REJECT("Desk: your trust line is not authorised yet (KYC pending).");

    // ── 4. How many tokens, and does the treasury have them? ────────────────
    int64_t paid = float_sto_set(amount, 8);
    int64_t units = float_divide(paid, float_set(0, price));
    if (units <= 0)
        REJECT("Desk: amount too small.");

    uint8_t tl_kl[34];
    if (util_keylet(SBUF(tl_kl), KEYLET_LINE, SBUF(hook_acc), tok_issuer, 20, tok, 20) != 34 ||
        slot_set(SBUF(tl_kl), 3) != 3 || slot_subfield(3, sfBalance, 4) != 4)
        REJECT("Desk: the treasury holds no tokens.");
    int64_t balance = slot_float(4);
    // RippleState balances are stored from the low account's side
    int t_cmp = 0;
    ACCOUNT_COMPARE(t_cmp, hook_acc, tok_issuer);
    if (t_cmp > 0)
        balance = float_negate(balance);
    if (float_compare(units, balance, COMPARE_GREATER) == 1)
        REJECT("Desk: not enough tokens left for this subscription.");

    // ── 5. Deliver ──────────────────────────────────────────────────────────
    etxn_reserve(1);
    uint8_t tl_amt[49];
    if (float_sto(SBUF(tl_amt), tok, 20, tok_issuer, 20, units, sfAmount) != 49)
        REJECT("Desk: could not serialise the token amount.");
    uint8_t *raw_amt = tl_amt + 1; // skip the field id, the macro wants the bare amount
    uint8_t txn[PREPARE_PAYMENT_SIMPLE_TRUSTLINE_SIZE];
    PREPARE_PAYMENT_SIMPLE_TRUSTLINE(txn, raw_amt, sender, 0, 0);
    uint8_t emithash[32];
    if (emit(SBUF(emithash), SBUF(txn)) != 32)
        REJECT("Desk: could not emit the token payment.");

    OK("Desk: subscription accepted, tokens on the way.");
    return 0;
}
