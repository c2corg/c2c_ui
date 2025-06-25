# Documentation for "Mobilité douce" made by Smart/Origin

This documentation concerns the **"Public Transport Access"** box code, which appears on the camp to camp routes

## "Show Nearby Stops" section

This section is used to search for public transport stops around 'access' waypoints.
The public transport data comes from an external API called Navitia, which is stored in the CamptoCamp database.

To have visible results, **you must have launched the script "get_public_transports_from_France.sh" in the backend (see backend documentation)**

```
(on api_v6/ )
sh get_public_transports_from_France.sh
```

Files created / used :
`c2c_ui/src/views/document/utils/boxes/TransportsBox.vue` => Parent view of the section

`c2c_ui/src/views/document/utils/boxes/NearbyStopsSection.vue` => Features for nearby stops

`c2c_ui/src/views/document/utils/boxes/IsReachableByPublicTransportsBox.vue`=> Displays the small card on the left to indicate if there is at least one transport uploaded by the database for this route

`c2c_ui/src/components/map/OlMap.vue` => Map-related features

`c2c_ui/src/components/map/map-utils.vue` => Map Objects Style

`c2c_ui/src/js/apis/transport-service.js` => Calling the backend to get results from the database

`c2c_ui/src/assets/img/boxes/...` => Images

## "Plan a trip" section

This section is used to plan a trip by calling the Navitia API.
Unlike the previous section, we don't store the results in the database; we query Navitia directly by launching a query from the backend.

This section uses the calculated_duration attribute, **which is calculated with the calcul_duration_for_routes.sh script in the backend (see backend documentation)**

```
(on api_v6/ )
sh calcul_duration_for_routes.sh
```

Files created / used :
`c2c_ui/src/views/document/utils/boxes/TransportsBox.vue` => Parent view of the section

`c2c_ui/src/views/document/utils/boxes/PlanATripSection.vue` => Features for planning a trip

`c2c_ui/src/js/apis/navitia-service.js` => Navitia's call on the back

`c2c_ui/src/components/map/OlMap.vue` => Map-related features

`c2c_ui/src/components/map/map-utils.vue` => Map Objects Style

`c2c_ui/src/assets/img/boxes/... (images)` => Images

## Page mobilité douce

todo
