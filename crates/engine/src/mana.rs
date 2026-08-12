use std::collections::{HashSet, VecDeque};

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum Color {
    White,
    Blue,
    Black,
    Red,
    Green,
    Colorless,
}

impl Color {
    const ALL: [Self; 6] = [
        Self::White,
        Self::Blue,
        Self::Black,
        Self::Red,
        Self::Green,
        Self::Colorless,
    ];

    const fn index(self) -> usize {
        match self {
            Self::White => 0,
            Self::Blue => 1,
            Self::Black => 2,
            Self::Red => 3,
            Self::Green => 4,
            Self::Colorless => 5,
        }
    }
}

#[derive(Clone, Copy, Debug, Default, Eq, Hash, PartialEq)]
pub struct ManaPool([u16; 6]);

impl ManaPool {
    #[must_use]
    pub const fn new() -> Self {
        Self([0; 6])
    }

    #[must_use]
    pub fn with(mut self, color: Color, amount: u16) -> Self {
        self.0[color.index()] = self.0[color.index()].saturating_add(amount);
        self
    }

    #[must_use]
    pub fn amount(self, color: Color) -> u16 {
        self.0[color.index()]
    }

    fn add(&mut self, other: Self) {
        for (ours, produced) in self.0.iter_mut().zip(other.0) {
            *ours = ours.saturating_add(produced);
        }
    }

    fn try_pay_generic(mut self, amount: u16) -> Option<Self> {
        let mut remaining = amount;
        // Deterministic auto-pay order: colorless, then WUBRG.
        for color in [
            Color::Colorless,
            Color::White,
            Color::Blue,
            Color::Black,
            Color::Red,
            Color::Green,
        ] {
            let slot = &mut self.0[color.index()];
            let spend = (*slot).min(remaining);
            *slot -= spend;
            remaining -= spend;
        }
        (remaining == 0).then_some(self)
    }

    fn try_pay(self, cost: ManaCost) -> Option<Self> {
        let mut remaining = self;
        for color in Color::ALL {
            let required = cost.colored[color.index()];
            let available = &mut remaining.0[color.index()];
            if *available < required {
                return None;
            }
            *available -= required;
        }
        remaining.try_pay_generic(cost.generic)
    }
}

#[derive(Clone, Copy, Debug, Default, Eq, Hash, PartialEq)]
pub struct ManaCost {
    generic: u16,
    colored: [u16; 6],
}

impl ManaCost {
    #[must_use]
    pub const fn new(generic: u16) -> Self {
        Self {
            generic,
            colored: [0; 6],
        }
    }

    #[must_use]
    pub fn with(mut self, color: Color, amount: u16) -> Self {
        self.colored[color.index()] = self.colored[color.index()].saturating_add(amount);
        self
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ManaSource {
    pub id: u32,
    /// Generic mana paid before this source produces mana, e.g. one for a Signet.
    pub activation_generic: u16,
    pub produces: ManaPool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentPlan {
    pub activation_order: Vec<u32>,
    pub remaining_pool: ManaPool,
}

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
struct SearchState {
    pool: ManaPool,
    used: Vec<bool>,
}

/// Finds the fewest source activations needed to pay a cost.
///
/// Sources are single-use for this search, modeling tapping. Activation costs
/// are paid before production, so a land can correctly fund a Signet.
#[must_use]
pub fn find_payment(
    initial_pool: ManaPool,
    cost: ManaCost,
    sources: &[ManaSource],
) -> Option<PaymentPlan> {
    let initial = SearchState {
        pool: initial_pool,
        used: vec![false; sources.len()],
    };
    let mut queue = VecDeque::from([(initial.clone(), Vec::new())]);
    let mut visited = HashSet::from([initial]);

    while let Some((state, activations)) = queue.pop_front() {
        if let Some(remaining_pool) = state.pool.try_pay(cost) {
            return Some(PaymentPlan {
                activation_order: activations,
                remaining_pool,
            });
        }

        for (index, source) in sources.iter().enumerate() {
            if state.used[index] {
                continue;
            }
            let Some(mut pool) = state.pool.try_pay_generic(source.activation_generic) else {
                continue;
            };
            pool.add(source.produces);
            let mut next = SearchState {
                pool,
                used: state.used.clone(),
            };
            next.used[index] = true;
            if visited.insert(next.clone()) {
                let mut next_activations = activations.clone();
                next_activations.push(source.id);
                queue.push_back((next, next_activations));
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn land_can_fund_signet_activation() {
        let sources = [
            ManaSource {
                id: 10,
                activation_generic: 0,
                produces: ManaPool::new().with(Color::Colorless, 1),
            },
            ManaSource {
                id: 20,
                activation_generic: 1,
                produces: ManaPool::new()
                    .with(Color::Blue, 1)
                    .with(Color::Black, 1),
            },
        ];
        let cost = ManaCost::new(0)
            .with(Color::Blue, 1)
            .with(Color::Black, 1);

        let plan = find_payment(ManaPool::new(), cost, &sources).expect("cost is payable");
        assert_eq!(plan.activation_order, vec![10, 20]);
    }

    #[test]
    fn impossible_cost_returns_none() {
        let sources = [ManaSource {
            id: 1,
            activation_generic: 0,
            produces: ManaPool::new().with(Color::Red, 1),
        }];
        assert_eq!(
            find_payment(
                ManaPool::new(),
                ManaCost::new(0).with(Color::Green, 1),
                &sources
            ),
            None
        );
    }
}

