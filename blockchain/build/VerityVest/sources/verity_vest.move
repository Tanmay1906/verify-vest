module trm::verity_vest {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_std::table;
    use aptos_std::table::Table;

    /// =========================================================
    /// ================ STRUCT DEFINITIONS =====================
    /// =========================================================

    struct Grant has key, store, drop {
        donor: address,
        title: vector<u8>,
        amount: u64,
        milestones: u64,
        metadata_uri: vector<u8>,
    }

    struct Proposal has key, store, drop {
        applicant: address,
        grant_id: vector<u8>,
        requested_amount: u64,
        metadata_uri: vector<u8>,
    }

    struct Milestone has key, store, drop {
        applicant: address,
        proposal_id: vector<u8>,
        milestone_index: u64,
        evidence: vector<u8>,
    }

    struct Verification has key, store, drop {
        verifier: address,
        proposal_id: vector<u8>,
        milestone_index: u64,
        approved: bool,
        notes: vector<u8>,
    }

    /// =========================================================
    /// ================ STORAGE STRUCTURES =====================
    /// =========================================================

    struct VerityVestStore has key {
        grants: Table<vector<u8>, Grant>,
        proposals: Table<vector<u8>, Proposal>,
        milestones: Table<vector<u8>, Milestone>,
        verifications: Table<vector<u8>, Verification>,

        grant_created_event: event::EventHandle<vector<u8>>,
        proposal_created_event: event::EventHandle<vector<u8>>,
        milestone_submitted_event: event::EventHandle<vector<u8>>,
        verification_logged_event: event::EventHandle<vector<u8>>,
    }

    /// =========================================================
    /// ================ INITIALIZER ============================
    /// =========================================================

    public entry fun initialize(admin: &signer) {
        let addr = signer::address_of(admin);

        if (!exists<VerityVestStore>(addr)) {
            move_to(
                admin,
                VerityVestStore {
                    grants: table::new<vector<u8>, Grant>(),
                    proposals: table::new<vector<u8>, Proposal>(),
                    milestones: table::new<vector<u8>, Milestone>(),
                    verifications: table::new<vector<u8>, Verification>(),
                    grant_created_event: account::new_event_handle<vector<u8>>(admin),
                    proposal_created_event: account::new_event_handle<vector<u8>>(admin),
                    milestone_submitted_event: account::new_event_handle<vector<u8>>(admin),
                    verification_logged_event: account::new_event_handle<vector<u8>>(admin),
                },
            );
        };
    }

    /// =========================================================
    /// ================ GRANT CREATION =========================
    /// =========================================================

    public entry fun create_grant<CoinType>(
        donor: &signer,
        grant_id: vector<u8>,
        title: vector<u8>,
        amount: u64,
        milestones: u64,
        metadata_uri: vector<u8>
    ) acquires VerityVestStore {
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(donor));

        let grant = Grant {
            donor: signer::address_of(donor),
            title,
            amount,
            milestones,
            metadata_uri,
        };

        table::add(&mut store_ref.grants, grant_id, grant);
        event::emit_event(&mut store_ref.grant_created_event, b"Grant Created");
    }

    /// =========================================================
    /// ================ PROPOSAL APPLICATION ===================
    /// =========================================================

    public entry fun apply_proposal(
        applicant: &signer,
        proposal_id: vector<u8>,
        grant_id: vector<u8>,
        requested_amount: u64,
        metadata_uri: vector<u8>
    ) acquires VerityVestStore {
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(applicant));

        let proposal = Proposal {
            applicant: signer::address_of(applicant),
            grant_id,
            requested_amount,
            metadata_uri,
        };

        table::add(&mut store_ref.proposals, proposal_id, proposal);
        event::emit_event(&mut store_ref.proposal_created_event, b"Proposal Applied");
    }

    /// =========================================================
    /// ================ MILESTONE SUBMISSION ===================
    /// =========================================================

    public entry fun submit_milestone(
        applicant: &signer,
        proposal_id: vector<u8>,
        milestone_index: u64,
        evidence: vector<u8>
    ) acquires VerityVestStore {
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(applicant));

        let milestone = Milestone {
            applicant: signer::address_of(applicant),
            proposal_id,
            milestone_index,
            evidence,
        };

        table::add(&mut store_ref.milestones, proposal_id, milestone);
        event::emit_event(&mut store_ref.milestone_submitted_event, b"Milestone Submitted");
    }

    /// =========================================================
    /// ================ VERIFICATION LOGGING ===================
    /// =========================================================

    public entry fun verify_milestone(
        verifier: &signer,
        proposal_id: vector<u8>,
        milestone_index: u64,
        approved: bool,
        notes: vector<u8>
    ) acquires VerityVestStore {
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(verifier));

        let verification = Verification {
            verifier: signer::address_of(verifier),
            proposal_id,
            milestone_index,
            approved,
            notes,
        };

        table::add(&mut store_ref.verifications, proposal_id, verification);
        event::emit_event(&mut store_ref.verification_logged_event, b"Verification Logged");
    }

    /// =========================================================
    /// ================ FUND DISBURSEMENT ======================
    /// =========================================================

    public entry fun disburse_funds<CoinType>(
        donor: &signer,
        recipient: address,
        amount: u64
    ) {
        coin::transfer<CoinType>(donor, recipient, amount);
    }

    /// Note: On-chain view helpers returning references borrowed from global storage
    /// are intentionally omitted to satisfy Move's borrow checker. Use events or
    /// off-chain indexers to query data.
}
