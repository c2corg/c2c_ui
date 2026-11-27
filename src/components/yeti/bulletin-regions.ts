import { booleanIntersects as turfBooleanIntersects } from '@turf/boolean-intersects';
import { buffer as turfBuffer } from '@turf/buffer';
import { simplify as turfSimplify } from '@turf/simplify';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';

import { bulletinRegionId } from '@/components/yeti/avalanche-bulletin';
import type { AvalancheBulletin } from '@/js/apis/avalanche-bulletin-service';
import yetiService from '@/js/apis/yeti-service';

// a zone of the avalanche bulletins (BRA), and its bulletin
type Zone = Feature<Polygon | MultiPolygon, { name: string; country: string; numZone?: string | null }>;
export type Bra = {
  id: string;
  name: string;
  fullname?: string;
  country: string;
  zone: string;
  urls: { url: string }[];
  danger: { max: number | null };
  orientations: Record<string, unknown>;
  validUntil: string;
};
// a zone of a document, its EAWS region (none when the c2c API has no bulletin for it) and the bulletins of the API:
// undefined until asked, null while fetched
export type Region = { bra: Bra; regionId: string | null; bulletins?: AvalancheBulletin[] | null; failed: boolean };

/** The geometry of a document, as the API gives it (EPSG:3857): a track (geom_detail) or its point/outline (geom) */
export type DocumentGeometry = { geom?: string | null; geom_detail?: string | null } | null | undefined;

/**
 * The bulletin regions of the zones the geometries cross (the union for several): the ENSG zones, each with its EAWS
 * region id. Empty when there is no geometry, or no zone.
 */
export async function findBulletinRegions(geometries: DocumentGeometry[]): Promise<Region[]> {
  const usable = geometries.filter((geometry) => geometry?.geom_detail || geometry?.geom);
  if (!usable.length) {
    return [];
  }

  // OpenLayers' GeoJSON format (reprojection) loaded with the zones, not in the startup bundle (#4876)
  const [response, { default: GeoJSONFormat }] = (await Promise.all([
    yetiService.zonesBra(),
    import('ol/format/GeoJSON'),
  ])) as [{ data: FeatureCollection<Polygon | MultiPolygon, Zone['properties']> }, typeof import('ol/format/GeoJSON')];

  const GeoJSON = new GeoJSONFormat();
  // use WGS 84 projection for buffering with turf
  const buffered = usable.map(
    (geometry) =>
      (
        turfBuffer(
          turfSimplify(
            GeoJSON.writeGeometryObject(
              GeoJSON.readGeometry(JSON.parse((geometry!.geom_detail ?? geometry!.geom)!), {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:4326',
              })!
            ) as Geometry,
            { tolerance: 0.01, highQuality: false }
          ),
          geometry!.geom_detail ? 1 : 2,
          { units: 'kilometers' }
        ) as Feature<Polygon | MultiPolygon>
      ).geometry
  );

  const zones = response.data.features.filter((feature) => {
    const zone = turfBuffer(feature.geometry, 0.001, { units: 'kilometers' })!.geometry;
    return buffered.some((geometry) => turfBooleanIntersects(zone, geometry));
  });
  if (!zones.length) {
    return [];
  }

  const m = new Map(zones.map((zone) => [zone.properties.name + '@' + zone.properties.country, zone]));
  const summary: { data: { zones: Bra[] } } = await yetiService.bra();
  return summary.data.zones
    .filter((zone) => m.has(zone.zone + '@' + zone.country))
    .map((zone) => {
      const feature = m.get(zone.zone + '@' + zone.country)!;
      return {
        bra: { ...feature.properties, ...zone },
        regionId: bulletinRegionId({
          ...feature.properties,
          contains: (lonLat) => turfBooleanIntersects({ type: 'Point', coordinates: lonLat }, feature.geometry),
        }),
        failed: false,
      };
    });
}
