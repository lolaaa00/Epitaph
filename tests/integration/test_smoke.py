"""Smoke check that the deployed EpitaphLegacyProtocol contract is reachable
and its schema exposes the methods the frontend calls. Run with:

    gltest tests/integration/test_smoke.py -v -s --network studionet
"""

from gltest import get_contract_factory, get_accounts


EXPECTED_WRITE_METHODS = {
    "create_legacy_vault",
    "submit_evidence",
    "submit_memory",
    "request_legacy_inscription",
    "open_fracture",
    "resolve_fracture",
    "seal_vault",
}

EXPECTED_READ_METHODS = {
    "get_vault",
    "get_vault_count",
    "get_vault_id_at",
    "get_evidence",
    "get_evidence_count",
    "get_memory",
    "get_memory_count",
    "get_inscription",
    "get_latest_inscription",
    "get_fracture",
    "get_fracture_count",
    "get_fracture_id_at",
    "get_protocol_event",
    "get_protocol_event_count",
}


def test_deploy_and_open_vault():
    accounts = get_accounts()
    account = accounts[0]

    factory = get_contract_factory(contract_file_path="EpitaphLegacyProtocol.py")
    contract = factory.deploy(account=account)

    assert contract.address is not None

    count_before = contract.connect(account).get_vault_count(args=[])
    assert int(count_before) == 0

    contract.connect(account).create_legacy_vault(
        args=[
            "gltest-smoke-vault",
            "Smoke Test Person",
            "2000 - 2020",
            "a fictional test subject used only to verify the deployed contract",
            "This vault exists solely to confirm the deployed bytecode accepts writes correctly.",
            "test harness",
            "OTHER",
            "https://example.com/smoke-test",
            "Synthetic evidence created by the integration smoke test.",
        ],
        account=account,
    )

    vault = contract.connect(account).get_vault(args=["gltest-smoke-vault"])
    assert vault["person_name"] == "Smoke Test Person"
    assert int(vault["evidence_count"]) == 1
    assert vault["state"] == "COLLECTING"

    count_after = contract.connect(account).get_vault_count(args=[])
    assert int(count_after) == int(count_before) + 1
