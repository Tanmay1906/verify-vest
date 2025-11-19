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

    /// Composite keys for tables
    struct MilestoneKey has copy, drop, store {
        proposal_id: vector<u8>,
        milestone_index: u64,
    }

    struct VerificationKey has copy, drop, store {
        proposal_id: vector<u8>,
        milestone_index: u64,
    }

    /// =========================================================
    /// ================ EVENT DEFINITIONS ======================
    /// =========================================================

    struct GrantCreatedEvent has drop, store, copy {
        donor: address,
        grant_id: vector<u8>,
        title: vector<u8>,
        amount: u64,
        milestones: u64,
        metadata_uri: vector<u8>,
    }

    struct ProposalCreatedEvent has drop, store, copy {
        applicant: address,
        proposal_id: vector<u8>,
        grant_id: vector<u8>,
        requested_amount: u64,
        metadata_uri: vector<u8>,
    }

    struct MilestoneSubmittedEvent has drop, store, copy {
        applicant: address,
        proposal_id: vector<u8>,
        milestone_index: u64,
        evidence: vector<u8>,
    }

    struct VerificationLoggedEvent has drop, store, copy {
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
        milestones: Table<MilestoneKey, Milestone>,
        verifications: Table<VerificationKey, Verification>,

        grant_created_event: event::EventHandle<GrantCreatedEvent>,
        proposal_created_event: event::EventHandle<ProposalCreatedEvent>,
        milestone_submitted_event: event::EventHandle<MilestoneSubmittedEvent>,
        verification_logged_event: event::EventHandle<VerificationLoggedEvent>,
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
                    milestones: table::new<MilestoneKey, Milestone>(),
                    verifications: table::new<VerificationKey, Verification>(),
                    grant_created_event: account::new_event_handle<GrantCreatedEvent>(admin),
                    proposal_created_event: account::new_event_handle<ProposalCreatedEvent>(admin),
                    milestone_submitted_event: account::new_event_handle<MilestoneSubmittedEvent>(admin),
                    verification_logged_event: account::new_event_handle<VerificationLoggedEvent>(admin),
                },
            );
        };
    }

    fun ensure_initialized(actor: &signer) acquires VerityVestStore {
        let addr = signer::address_of(actor);
        if (!exists<VerityVestStore>(addr)) {
            initialize(actor);
        }
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
        ensure_initialized(donor);
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(donor));

        let grant = Grant {
            donor: signer::address_of(donor),
            title,
            amount,
            milestones,
            metadata_uri,
        };

        table::add(&mut store_ref.grants, grant_id, grant);
        event::emit_event(&mut store_ref.grant_created_event, GrantCreatedEvent {
            donor: signer::address_of(donor),
            grant_id,
            title: grant.title,
            amount: grant.amount,
            milestones: grant.milestones,
            metadata_uri: grant.metadata_uri,
        });
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
        ensure_initialized(applicant);
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(applicant));

        let proposal = Proposal {
            applicant: signer::address_of(applicant),
            grant_id,
            requested_amount,
            metadata_uri,
        };

        table::add(&mut store_ref.proposals, proposal_id, proposal);
        event::emit_event(&mut store_ref.proposal_created_event, ProposalCreatedEvent {
            applicant: signer::address_of(applicant),
            proposal_id,
            grant_id,
            requested_amount,
            metadata_uri,
        });
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
        ensure_initialized(applicant);
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(applicant));

        let milestone = Milestone {
            applicant: signer::address_of(applicant),
            proposal_id,
            milestone_index,
            evidence,
        };

        let key = MilestoneKey { proposal_id, milestone_index };
        // Replace if exists to allow re-submission with updated evidence
        if (table::contains(&store_ref.milestones, key)) {
            let key_copy = MilestoneKey { proposal_id: milestone.proposal_id, milestone_index: milestone.milestone_index };
            let _old = table::remove(&mut store_ref.milestones, key_copy);
        };
        table::add(&mut store_ref.milestones, key, milestone);
        event::emit_event(&mut store_ref.milestone_submitted_event, MilestoneSubmittedEvent {
            applicant: signer::address_of(applicant),
            proposal_id,
            milestone_index,
            evidence,
        });
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
        ensure_initialized(verifier);
        let store_ref = borrow_global_mut<VerityVestStore>(signer::address_of(verifier));

        let verification = Verification {
            verifier: signer::address_of(verifier),
            proposal_id,
            milestone_index,
            approved,
            notes,
        };

        let key = VerificationKey { proposal_id, milestone_index };
        if (table::contains(&store_ref.verifications, key)) {
            let key_copy = VerificationKey { proposal_id: verification.proposal_id, milestone_index: verification.milestone_index };
            let _old = table::remove(&mut store_ref.verifications, key_copy);
        };
        table::add(&mut store_ref.verifications, key, verification);
        event::emit_event(&mut store_ref.verification_logged_event, VerificationLoggedEvent {
            verifier: signer::address_of(verifier),
            proposal_id,
            milestone_index,
            approved,
            notes,
        });
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
