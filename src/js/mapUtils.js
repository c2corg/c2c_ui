
import proj4 from 'proj4';

var ESPG_4326 = new proj4.Proj('EPSG:4326');
var ESPG_3785 = new proj4.Proj('GOOGLE');

var result = {

    getDocumentLatLng(document){
        var point_3785 = JSON.parse(document.geometry.geom).coordinates
        var point =  proj4.transform(ESPG_3785, ESPG_4326, point_3785)
        return new window.google.maps.LatLng(point.y, point.x)
    },

    getBounds(documents){
        var bounds = new window.google.maps.LatLngBounds()

        documents.forEach(document => {
            bounds.extend(this.getDocumentLatLng(document))
        }, this)

        return bounds
    },

    getPositions(documents){
        var result = []

        documents.forEach(document => {
            result.push(this.getDocumentLatLng(document))
        }, this)

        return result
    },

    fitBounds(map, bounds){
        map.fitBounds(bounds);
    }
}

export default result;
