function AssociationService(api) {
  this.api = api;
}

AssociationService.prototype.create = function(parent, child) {
  const pType = parent.type;
  const cType = child.type;

  const data = {};

  // https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/addassociation.js#L91
  // parent and child type are predetermined
  if (
    (pType === 'c' && ['w', 'o', 'r', 'b', 'c', 'x', 'u'].includes(cType)) ||
    pType === 'i' ||
    (pType === 'o' && (cType === 'r' || cType === 'u')) ||
    (pType === 'r' && (cType === 'w' || cType === 'b')) ||
    (pType === 'w' && cType === 'b') ||
    (pType === 'x' && ['w', 'o', 'r', 'u'].includes(cType))
  ) {
    data.parent_document_id = child.document_id;
    data.child_document_id = parent.document_id;
  } else {
    data.parent_document_id = parent.document_id;
    data.child_document_id = child.document_id;
  }

  return this.api.post('/associations', data);
};

AssociationService.prototype.remove = function(parent, child) {
  const data = {
    parent_document_id: parent.document_id,
    child_document_id: child.document_id
  };

  return this.api.delete('/associations', { data });
};

export default AssociationService;
