
import ol from '@/libs/ol.js'
import utils from "@/js/utils.js"


const buildTextStyle = function(title, highlight){
//createTextStyle_ = function(feature, type, highlight) {
    let text;

    if (highlight) { // on hover in list view
        var def = {
            text: utils.stringDivider(title, 30, '\n'),
            textAlign: 'left',
            overflow: true,
            offsetX: 20,
            font: '12px verdana,sans-serif',
            stroke: new ol.style.Stroke({
                color: 'white',
                width: 3
            }),
            fill: new ol.style.Fill({
                color: 'black'
            }),
            textBaseline: 'middle'
        }

        text = new ol.style.Text(def)
    }

    return text;
}

export const buildPolygonStyle = function(title, highlight) {
    const opacityFactor = highlight ? 1.5 : 1

    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: [51, 122, 183, 0.8 * opacityFactor],
            width: 1,
        }),
        fill: new ol.style.Fill({
            color: [51, 122, 183, 0.4 * opacityFactor]
        }),
        text: buildTextStyle(title, highlight),
    })
}

export const buildDiffStyle = function(isOld){

    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: isOld ? 'red' : 'green',
            width: isOld ? 5 : 3,
        }),
        image: new ol.style.Circle({
            fill : new ol.style.Fill({
                color: isOld ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.9)'
            }),
            radius :  isOld ? 10 : 5,
        })
    })
}

export const buildLineStyle = function(title, highlight) {

    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: highlight ? 'red' : 'yellow',
            width: 3
        }),
        text: buildTextStyle(title, highlight),
    })
}

const buildPointStyle = function(title, src, color, highlight){

    if( src === undefined)
        throw "Bad document type"

    var scale = highlight ? 0.55 : 0.4
    var imgSize = highlight ? 22 : 16;

    var iconStyle = new ol.style.Style({
        image: new ol.style.Icon({
            scale: scale,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            color: color,
            src: src,
        }),
        text: buildTextStyle(title, highlight)
    })

    var circleStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: imgSize,
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.5)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ddd',
                width: 2
            })
        })
    })

    return [circleStyle, iconStyle]
}

export const getDocumentStyle = function(document, title, highlight, isLine){

    if(isLine){
        return buildLineStyle(title, highlight)
    }

    // TODO : put style in a cache
    const type = document.type

    const urlByType = {
        i : require('@/assets/img/documents/images.svg'),
        o : require('@/assets/img/documents/outings.svg'),
        r : require('@/assets/img/documents/routes.svg'),
        u : require('@/assets/img/documents/profiles.svg'),
        x : require('@/assets/img/documents/xreports.svg'),
    }

    let color = '#FFAA45' // Usual icon orange

    if(document.condition_rating === 'excellent')
        color = '#008000';

    else if(document.condition_rating === 'good')
        color = '#9ACD32';

    else if(document.condition_rating === 'average')
        color = '#FFFF00';

    else if(document.condition_rating === 'poor')
        color = '#FF0000';

    else if(document.condition_rating === 'awful')
        color = '#8B0000';

    if(type == "w")
        return buildPointStyle(
            title,
            require('@/assets/img/documents/waypoints/' + document.waypoint_type + '.svg'),
            color,
            highlight
        )

    if(type == "i" || type == "u" || type == "x" || type == "o" || type=="r")
        return buildPointStyle(title, urlByType[type], color, highlight)

}

export const geoJSONFormat = new ol.format.GeoJSON()
