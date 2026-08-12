use crate::ids::{CardDefinitionId, ObjectId, PlayerId};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenBatch {
    pub id: ObjectId,
    pub definition: CardDefinitionId,
    pub controller: PlayerId,
    pub quantity: u64,
    pub tapped: bool,
    pub summoning_sick: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MaterializedToken {
    pub id: ObjectId,
    pub definition: CardDefinitionId,
    pub controller: PlayerId,
    pub tapped: bool,
    pub summoning_sick: bool,
}

impl TokenBatch {
    /// Splits exactly one token from a batch when an effect distinguishes it.
    pub fn individualize(&mut self, new_id: ObjectId) -> Option<MaterializedToken> {
        if self.quantity == 0 {
            return None;
        }
        self.quantity -= 1;
        Some(MaterializedToken {
            id: new_id,
            definition: self.definition,
            controller: self.controller,
            tapped: self.tapped,
            summoning_sick: self.summoning_sick,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn million_tokens_remain_one_batch_until_distinguished() {
        let mut batch = TokenBatch {
            id: ObjectId(1),
            definition: CardDefinitionId(7),
            controller: PlayerId(2),
            quantity: 1_000_000,
            tapped: false,
            summoning_sick: true,
        };

        let token = batch.individualize(ObjectId(2)).expect("token");
        assert_eq!(batch.quantity, 999_999);
        assert_eq!(token.id, ObjectId(2));
    }
}

