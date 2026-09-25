// probe.c: roll back every transaction that reaches this account's Hook,
// except the account's own. Used once to see who the ledger asks.
#include "hookapi.h"
int64_t hook(uint32_t reserved)
{
    uint8_t hook_acc[20], sender[20];
    hook_account(SBUF(hook_acc));
    otxn_field(SBUF(sender), sfAccount);
    int own = 0;
    BUFFER_EQUAL(own, hook_acc, sender, 20);
    if (own)
        accept(SBUF("Probe: own transaction."), __LINE__);
    rollback(SBUF("Probe: refused by the issuer's Hook."), __LINE__);
    return 0;
}
