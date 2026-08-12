use edh_nexus_engine::ids::{CardDefinitionId, ObjectId, PlayerId};
use edh_nexus_engine::tokens::TokenBatch;

#[test]
fn token_count_does_not_change_batch_size() {
    let one = TokenBatch {
        id: ObjectId(1),
        definition: CardDefinitionId(1),
        controller: PlayerId(1),
        quantity: 1,
        tapped: false,
        summoning_sick: false,
    };
    let million = TokenBatch {
        quantity: 1_000_000,
        ..one.clone()
    };

    assert_eq!(std::mem::size_of_val(&one), std::mem::size_of_val(&million));
}
