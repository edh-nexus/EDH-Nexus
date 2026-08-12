use crate::ids::CardDefinitionId;

/// Immutable card data imported from a versioned Scryfall snapshot.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OracleCard {
    pub id: CardDefinitionId,
    pub oracle_id: String,
    pub name: String,
    pub mana_cost: Option<String>,
    pub type_line: String,
    pub oracle_text: String,
    pub source_updated_at: String,
}

/// Read-only boundary used by the engine; network access belongs in an importer.
pub trait CardCatalog {
    fn by_id(&self, id: CardDefinitionId) -> Option<&OracleCard>;
    fn scryfall_snapshot_updated_at(&self) -> &str;
}
