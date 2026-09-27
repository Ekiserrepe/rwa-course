/**
 * holding_cap.c: freeze any holder who ends up above a maximum holding.
 *
 * Install on the ISSUER with hsfCollect, set asfTshCollect on the issuer, and
 * set HookOn to every transaction type.
 *
 * Xahau makes a token's issuer only a WEAK stakeholder of transfers between
 * two holders: its Hook runs after the transaction has been applied, cannot
 * refuse it, and only runs at all if the issuer agrees to pay for it (collect
 * call). So this Hook does not block the transfer. It reacts right after.
 *
 * It doesn't try to guess from the transaction who received tokens: a
 * Payment's Amount can name another issuer, and a CheckCash, a Remit, a
 * payment channel claim, a URIToken bought with the token or a resting DEX
 * bid all move tokens without a "receiver" field. Instead it reads the
 * transaction's METADATA (meta_slot, available to weak executions): every
 * trust line of this token whose balance went UP is a candidate, and any
 * holder now above MAX gets a TrustSet that freezes their line. A frozen
 * holder can still send the excess back to the issuer, and the compliance
 * team decides what happens next.
 *
 * Install-time parameters (HookParameters):
 *   TOK     20 bytes: the token's currency code
 *   MAX      4 bytes: big-endian whole-token maximum per holder
 *   EXEMPT  optional, up to 4 account IDs of 20 bytes each: accounts the cap
 *           never freezes (the treasury, which holds the unsold supply and
 *           buys it back at maturity; a vault)
 */
#include "hookapi.h"

#define OK(msg) accept(SBUF(msg), __LINE__)

#define ttTRUST_SET 20
#define tfSET_FREEZE 0x00100000U
#define ltRIPPLE_STATE 0x0072
#define lsfLowFreeze 0x00400000U
#define lsfHighFreeze 0x00800000U
// 140 bytes of fields + 116 of EmitDetails (etxn_details refuses less than 116)
#define TRUSTSET_FREEZE_SIZE 256
#define MAX_NODES 32   // affected ledger objects examined per transaction
#define MAX_FREEZES 4  // freezes emitted per transaction
#define MAX_EXEMPT 4

// 20-byte account IDs and currency codes, compared and copied without loops
#define EQ20(a, b) (*(uint64_t *)(a) == *(uint64_t *)(b) && *(uint64_t *)((a) + 8) == *(uint64_t *)((b) + 8) && \
                    *(uint32_t *)((a) + 16) == *(uint32_t *)((b) + 16))
#define COPY20(d, s) { *(uint64_t *)(d) = *(uint64_t *)(s); *(uint64_t *)((d) + 8) = *(uint64_t *)((s) + 8); \
                       *(uint32_t *)((d) + 16) = *(uint32_t *)((s) + 16); }

int64_t hook(uint32_t reserved)
{
    uint8_t hook_acc[20];
    hook_account(SBUF(hook_acc));

    uint8_t sender[20];
    otxn_field(SBUF(sender), sfAccount);
    if (EQ20(hook_acc, sender))
        OK("Cap: issuer's own transaction.");

    uint8_t tok[20], max_buf[4], exempt[20 * MAX_EXEMPT];
    uint8_t tok_key[3] = {'T', 'O', 'K'};
    uint8_t max_key[3] = {'M', 'A', 'X'};
    uint8_t exempt_key[6] = {'E', 'X', 'E', 'M', 'P', 'T'};
    if (hook_param(SBUF(tok), SBUF(tok_key)) != 20 || hook_param(SBUF(max_buf), SBUF(max_key)) != 4)
        OK("Cap: TOK and MAX parameters missing, doing nothing.");
    int64_t max = float_set(0, ((int64_t)max_buf[0] << 24) | ((int64_t)max_buf[1] << 16) |
                                   ((int64_t)max_buf[2] << 8) | (int64_t)max_buf[3]);
    int64_t exempt_len = hook_param(SBUF(exempt), SBUF(exempt_key));
    int n_exempt = exempt_len > 0 ? exempt_len / 20 : 0;

    // The transaction's effects: only there after it was applied (weak execution)
    if (meta_slot(1) != 1 || slot_subfield(1, sfAffectedNodes, 2) != 2)
        OK("Cap: no metadata to read (not an after-the-fact run).");
    int64_t n_nodes = slot_count(2);
    if (n_nodes > MAX_NODES)
        n_nodes = MAX_NODES;

    etxn_reserve(MAX_FREEZES);
    int frozen = 0;
    for (int i = 0; GUARD(MAX_NODES), i < n_nodes; ++i)
    {
        // One affected object: a trust line of our token?
        if (slot_subarray(2, i, 3) != 3 || slot_subfield(3, sfLedgerEntryType, 4) != 4)
            continue;
        uint8_t let[2];
        if (slot(SBUF(let), 4) != 2 || UINT16_FROM_BUF(let) != ltRIPPLE_STATE)
            continue;
        int created = 0;
        if (slot_subfield(3, sfFinalFields, 5) != 5)
        {
            if (slot_subfield(3, sfNewFields, 5) != 5)
                continue; // a deleted line holds nothing
            created = 1;
        }
        uint8_t bal[48], low[48], high[48];
        if (slot_subfield(5, sfBalance, 6) != 6 || slot(SBUF(bal), 6) != 48 ||
            slot_subfield(5, sfLowLimit, 7) != 7 || slot(SBUF(low), 7) != 48 ||
            slot_subfield(5, sfHighLimit, 8) != 8 || slot(SBUF(high), 8) != 48)
            continue;
        if (!EQ20(bal + 8, tok))
            continue; // another currency

        // Which side is the holder? The limits name each side's account
        uint8_t *holder;
        int holder_low;
        if (EQ20(high + 28, hook_acc)) { holder = low + 28; holder_low = 1; }
        else if (EQ20(low + 28, hook_acc)) { holder = high + 28; holder_low = 0; }
        else continue; // not a line with this issuer

        // The balance is stored from the low side: flip it when the holder is high
        int64_t now = slot_float(6);
        if (!holder_low)
            now = float_negate(now);
        if (float_compare(now, max, COMPARE_GREATER) != 1)
            continue;

        // Only react to lines that went UP in this transaction
        int64_t before = 0;
        if (!created)
        {
            if (slot_subfield(3, sfPreviousFields, 9) != 9 || slot_subfield(9, sfBalance, 10) != 10)
                continue; // balance unchanged
            before = slot_float(10);
            if (!holder_low)
                before = float_negate(before);
        }
        if (float_compare(now, before, COMPARE_GREATER) != 1)
            continue;

        // Already frozen by the issuer, or exempt?
        uint8_t lf[4];
        if (slot_subfield(5, sfFlags, 11) == 11 && slot(SBUF(lf), 11) == 4 &&
            (UINT32_FROM_BUF(lf) & (holder_low ? lsfHighFreeze : lsfLowFreeze)))
            continue; // the issuer is the high side when the holder is low
        int skip = 0;
        for (int e = 0; GUARD(MAX_NODES * MAX_EXEMPT), e < n_exempt; ++e)
            if (EQ20(exempt + 20 * e, holder))
                skip = 1;
        if (skip || frozen >= MAX_FREEZES)
            continue;

        // Build and emit: TrustSet { LimitAmount: 0 TOK/holder, Flags: tfSetFreeze }
        uint8_t limit[48];
        *(uint64_t *)limit = 0;
        limit[0] = 0x80; // the canonical zero token amount
        COPY20(limit + 8, tok);
        COPY20(limit + 28, holder);

        uint8_t txn[TRUSTSET_FREEZE_SIZE];
        uint8_t *buf_out = txn;
        uint32_t cls = (uint32_t)ledger_seq();
        _01_02_ENCODE_TT(buf_out, ttTRUST_SET);
        _02_02_ENCODE_FLAGS(buf_out, tfSET_FREEZE);
        _02_04_ENCODE_SEQUENCE(buf_out, 0);
        _02_26_ENCODE_FLS(buf_out, cls + 1);
        _02_27_ENCODE_LLS(buf_out, cls + 5);
        // sfLimitAmount (Amount field 3): the header byte, then the 48-byte amount.
        // Copied by hand: ENCODE_TL's own loop guard allows only one use per run.
        *buf_out++ = 0x63;
        uint64_t *to = (uint64_t *)buf_out, *from = (uint64_t *)limit;
        to[0] = from[0]; to[1] = from[1]; to[2] = from[2];
        to[3] = from[3]; to[4] = from[4]; to[5] = from[5];
        buf_out += 48;
        uint8_t *fee_ptr = buf_out;
        _06_08_ENCODE_DROPS_FEE(buf_out, 0);
        _07_03_ENCODE_SIGNING_PUBKEY_NULL(buf_out);
        _08_01_ENCODE_ACCOUNT_SRC(buf_out, hook_acc);
        if (etxn_details((uint32_t)buf_out, TRUSTSET_FREEZE_SIZE - (buf_out - txn)) < 0)
            continue;
        int64_t fee = etxn_fee_base(SBUF(txn));
        _06_08_ENCODE_DROPS_FEE(fee_ptr, fee);

        uint8_t emithash[32];
        if (emit(SBUF(emithash), SBUF(txn)) == 32)
            frozen++;
    }

    if (frozen == 0)
        OK("Cap: within the limit.");
    OK("Cap: limit exceeded, receiver frozen.");
    return 0;
}
