//let build our own d3 module, instead of a stupid `import * as d3 from 'd3'`

function D3(){
    this.resolved_ = false
    this.resolving_ = false
    this.callbacks_ = []
    this.resolvingCount_ = 0
}

D3.prototype.resolve_ = function(){
    if(this.resolved_ || this.resolving_)
        return

    this.resolving_ = true

    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-scale/src/linear'), "scaleLinear")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-geo/src/distance'), "geoDistance")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-time/src/hour'), "timeHour")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-shape/src/line'), "line")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-scale/src/time'), "scaleTime")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-transition'), "transition") // do not forget. d3 has a strange behavior...
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-format'), "format")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-time-format'), "timeFormat")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-axis/src/axis'), "axis")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-array'), "array")
    this.load_(import(/* webpackChunkName: "chunk-d3" */ 'd3-selection'), "selection")
}

D3.prototype.load_ = function(promise, key){

    this.resolvingCount_ ++

    promise.then(response => {
        if(response.default)
            this[key] = response.default
        else {
            for(let service of Object.keys(response)){
                this[service] = response[service]
            }
        }

        this.resolvingCount_ --

        if(this.resolvingCount_==0){
            this.resolving_ = false
            this.resolved_ = true
            this.postResolve_()
        }
    })
}


D3.prototype.postResolve_ = function(){
    for(let callback of this.callbacks_){
        callback()
    }
}

D3.prototype.then = function(callback){

    this.resolve_()

    if(this.resolved_)
        callback()
    else
        this.callbacks_.push(callback)
}

export default new D3()
