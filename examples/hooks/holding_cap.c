/**
 * holding_cap.c: freeze any holder who ends up above a maximum holding.
 *
 * Install on the ISSUER with hsfCollect, and set asfTshCollect on the issuer.
 * HookOn must include OfferCreate as well as Payment: without it, the issuer's
 * Hook is not run at all on DEX trades (tested).
 *
 * Xahau makes a token's issuer only a WEAK stakeholder of payments between two
 * holders: its Hook runs after the payment has been applied, cannot refuse
 * it, and only runs at all if the issuer agrees to pay for it (collect call).
 * So this Hook does not block the transfer. It reacts right after: if the
 * receiver (or, for a DEX order, the account that placed it) now holds more than MAX, it emits a TrustSet that freezes the
 * receiver's line. A frozen holder can still send the excess back to the
 * issuer, and the compliance team decides what happens next.
 *
 * Install-time parameters (HookParameters):
 *   TOK  20 bytes: the token's currency code
 *   MAX   4 bytes: big-endian whole-token maximum per holder
 */
#include "hookapi.h"

#define OK(msg) accept(SBUF(msg), __LINE__)

#define ttTRUST_SET 20
#define ttOFFER_CREATE 7
#define tfSET_FREEZE 0x00100000U
// 140 bytes of fields + 116 of EmitDetails (etxn_details refuses less than 116)
#define TRUSTSET_FREEZE_SIZE 256

int64_t hook(uint32_t reserved)
{
    uint8_t hook_acc[20];
    hook_account(SBUF(hook_acc));

    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);
    int own = 0;
    BUFFER_EQUAL(own, hook_acc, sender, 20);
    if (own)
        OK("Cap: issuer's own transaction.");

    uint8_t tok[20], max_buf[4];
    uint8_t tok_key[3] = {'T', 'O', 'K'};
    uint8_t max_key[3] = {'M', 'A', 'X'};
    if (hook_param(SBUF(tok), SBUF(tok_key)) != 20 || hook_param(SBUF(max_buf), SBUF(max_key)) != 4)
        OK("Cap: TOK and MAX parameters missing, doing nothing.");
    int64_t max = ((int64_t)max_buf[0] << 24) | ((int64_t)max_buf[1] << 16) | ((int64_t)max_buf[2] << 8) | (int64_t)max_buf[3];

    // Who may have ended up with more tokens?
    uint8_t dest[20];
    int64_t tt = otxn_type();
    if (tt == ttPAYMENT)
    {
        // Only payments of our own token, to someone other than us
        uint8_t amount[48];
        if (otxn_field(SBUF(amount), sfAmount) != 48)
            OK("Cap: not a token payment.");
        int ours = 0, our_code = 0;
        BUFFER_EQUAL(ours, amount + 28, hook_acc, 20);
        BUFFER_EQUAL(our_code, amount + 8, tok, 20);
        if (!ours || !our_code)
            OK("Cap: another token.");
        if (otxn_field(SBUF(dest), sfDestination) != 20)
            OK("Cap: no destination.");
        int to_us = 0;
        BUFFER_EQUAL(to_us, hook_acc, dest, 20);
        if (to_us)
            OK("Cap: returned to the issuer.");
    }
    else if (tt == ttOFFER_CREATE)
    {
        // A DEX order: check the account that placed it (a buyer taking offers).
        // Owners of resting bids that got filled are NOT checked here.
        for (int i = 0; GUARD(20), i < 20; ++i) dest[i] = sender[i];
    }
    else
        OK("Cap: not a payment or an order.");

    // The receiver's balance AFTER the payment (weak executions run after it)
    uint8_t kl[34];
    if (util_keylet(SBUF(kl), KEYLET_LINE, SBUF(dest), SBUF(hook_acc), SBUF(tok)) != 34 ||
        slot_set(SBUF(kl), 1) != 1 || slot_subfield(1, sfBalance, 2) != 2)
        OK("Cap: could not read the receiver's line.");
    int64_t balance = slot_float(2);
    int cmp = 0;
    ACCOUNT_COMPARE(cmp, dest, hook_acc);
    if (cmp > 0) // stored from the low account's side: flip if the holder is high
        balance = float_negate(balance);
    if (float_compare(balance, float_set(0, max), COMPARE_GREATER) != 1)
        OK("Cap: within the limit.");

    // Build and emit: TrustSet { LimitAmount: 0 TOK/receiver, Flags: tfSetFreeze }
    etxn_reserve(1);
    uint8_t limit[48];
    limit[0] = 0x80; // the canonical zero token amount
    for (int i = 1; GUARD(7), i < 8; ++i) limit[i] = 0;
    for (int i = 0; GUARD(20), i < 20; ++i) limit[8 + i] = tok[i];
    for (int i = 0; GUARD(20), i < 20; ++i) limit[28 + i] = dest[i];

    uint8_t txn[TRUSTSET_FREEZE_SIZE];
    uint8_t *buf_out = txn;
    uint32_t cls = (uint32_t)ledger_seq();
    _01_02_ENCODE_TT(buf_out, ttTRUST_SET);
    _02_02_ENCODE_FLAGS(buf_out, tfSET_FREEZE);
    _02_04_ENCODE_SEQUENCE(buf_out, 0);
    _02_26_ENCODE_FLS(buf_out, cls + 1);
    _02_27_ENCODE_LLS(buf_out, cls + 5);
    uint8_t *lim = limit;
    ENCODE_TL(buf_out, lim, 3); // sfLimitAmount is Amount field 3
    uint8_t *fee_ptr = buf_out;
    _06_08_ENCODE_DROPS_FEE(buf_out, 0);
    _07_03_ENCODE_SIGNING_PUBKEY_NULL(buf_out);
    _08_01_ENCODE_ACCOUNT_SRC(buf_out, hook_acc);
    int64_t details = etxn_details((uint32_t)buf_out, TRUSTSET_FREEZE_SIZE - (buf_out - txn));
    if (details < 0)
        accept(SBUF("Cap: limit exceeded, but EmitDetails failed."), details);
    int64_t fee = etxn_fee_base(SBUF(txn));
    _06_08_ENCODE_DROPS_FEE(fee_ptr, fee);

    uint8_t emithash[32];
    int64_t emitted = emit(SBUF(emithash), SBUF(txn));
    if (emitted != 32)
        accept(SBUF("Cap: limit exceeded, but the freeze could not be emitted."), emitted);
    OK("Cap: limit exceeded, receiver frozen.");
    return 0;
}
