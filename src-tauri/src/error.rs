use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
#[error("{0}")]
pub struct AppError(pub String);

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.0)
    }
}
