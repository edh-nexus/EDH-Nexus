use std::hint::black_box;
use std::time::Instant;

use edh_nexus_engine::ids::{CardDefinitionId, ObjectId, PlayerId, StackItemId};
use edh_nexus_engine::stack::{StackItem, StackZone};
use edh_nexus_engine::tokens::TokenBatch;

fn main() {
    println!("scenario,operations,elapsed_ns");

    let started = Instant::now();
    let mut batch = TokenBatch {
        id: ObjectId(1),
        definition: CardDefinitionId(1),
        controller: PlayerId(1),
        quantity: 1_000_000,
        tapped: false,
        summoning_sick: true,
    };
    black_box(batch.individualize(ObjectId(2)));
    println!(
        "token_batch_individualize,1000000,{}",
        started.elapsed().as_nanos()
    );

    let started = Instant::now();
    let mut stack = StackZone::new();
    for id in 0..100_000 {
        stack.push(StackItem {
            id: StackItemId(id),
            controller: PlayerId(1),
            source: ObjectId(id),
        });
    }
    while let Some(item) = stack.resolve_next() {
        black_box(item);
    }
    println!("stack_push_resolve,100000,{}", started.elapsed().as_nanos());
}
