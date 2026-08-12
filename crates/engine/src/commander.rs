use std::collections::BTreeMap;

use crate::ids::PlayerId;

pub const STARTING_LIFE: u16 = 40;
pub const LETHAL_COMMANDER_DAMAGE: u16 = 21;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommanderState {
    pub cast_count_from_command_zone: u16,
    damage_by_commander: BTreeMap<PlayerId, u16>,
}

impl CommanderState {
    #[must_use]
    pub fn new() -> Self {
        Self {
            cast_count_from_command_zone: 0,
            damage_by_commander: BTreeMap::new(),
        }
    }

    #[must_use]
    pub const fn next_tax(&self) -> u16 {
        self.cast_count_from_command_zone.saturating_mul(2)
    }

    pub fn record_combat_damage(&mut self, commander_owner: PlayerId, amount: u16) -> bool {
        let total = self.damage_by_commander.entry(commander_owner).or_default();
        *total = total.saturating_add(amount);
        *total >= LETHAL_COMMANDER_DAMAGE
    }
}

impl Default for CommanderState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tax_increases_by_two_per_prior_command_zone_cast() {
        let mut state = CommanderState::new();
        assert_eq!(state.next_tax(), 0);
        state.cast_count_from_command_zone = 3;
        assert_eq!(state.next_tax(), 6);
    }

    #[test]
    fn commander_damage_is_tracked_per_commander() {
        let mut state = CommanderState::new();
        assert!(!state.record_combat_damage(PlayerId(1), 20));
        assert!(!state.record_combat_damage(PlayerId(2), 20));
        assert!(state.record_combat_damage(PlayerId(1), 1));
    }
}
