export const ASSOCIATIONS_STORE_ABI = [
  "function storeAssociation((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record) sar)",
  "function revokeAssociation(bytes32 associationId, uint40 revokedAt)",
  "function updateAssociationSignatures(bytes32 associationId, bytes initiatorSignature, bytes approverSignature)",
  "function getAssociationsForAccount(bytes account) view returns ((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record)[] sars)",
  "function getAssociationIdsForAccount(bytes account) view returns (bytes32[] ids)",
  "function validateSignedAssociationRecord((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record) sar) view returns (bool)",
  "function delegationManager() view returns (address)",
  "function scDelegationEnforcer() view returns (address)",
  "function scDelegationVerifier() view returns (address)",
] as const;


