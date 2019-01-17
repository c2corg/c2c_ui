function AssociationService(api) {
    this.api = api
}

AssociationService.prototype.create = function(parent, child) {
    var pType = parent.type
    var cType = child.type

    const data = {}

    // parent and child type are predetermined
    if (
        (pType === 'c' && (cType === 'w' || cType === 'o' || cType === 'r' || cType === 'b' || cType === 'c' || cType === 'x' || cType === 'u')) ||
        pType === 'i' ||
        (pType === 'o' && (cType === 'r' || cType === 'u')) ||
        (pType === 'r' && (cType === 'w' || cType === 'b')) ||
        (pType === 'w' && cType === 'b') ||
        (pType === 'x' && (cType === 'r' || cType === 'o' || cType === 'w' || cType === 'u'))
    ) {
        data.parent_document_id = child.document_id
        data.child_document_id = parent.document_id
    } else {
        data.parent_document_id = parent.document_id
        data.child_document_id = child.document_id
    }

    return this.api.post('/associations', data)
}

AssociationService.prototype.remove = function(parent, child) {
    const data = {
        parent_document_id: parent.document_id,
        child_document_id: child.document_id
    }

    return this.api.delete('/associations', { data })
}

export default AssociationService
