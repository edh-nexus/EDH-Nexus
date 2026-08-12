macro_rules! id_type {
    ($name:ident) => {
        #[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
        pub struct $name(pub u64);
    };
}

id_type!(CardDefinitionId);
id_type!(ObjectId);
id_type!(PlayerId);
id_type!(StackItemId);
