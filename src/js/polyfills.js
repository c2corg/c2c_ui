
// extends javascript core objects
Array.prototype.toggle = function(value){
    if(!this.includes(value)){
        this.push(value);
        return true;
    } else {
        this.splice(this.indexOf(value), 1);
        return false;
    }
}

Array.prototype.remove = function(value){
    this.splice(this.indexOf(value), 1);

    return this
}
