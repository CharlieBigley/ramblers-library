
function raLoadLeaflet() {
    var map = new L.Map('leafletmap', {center: new L.LatLng(54.221592, -3.355007), zoom: 5});
    var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> '});
    var osm2 = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery Ã‚Â© <a href="http://mapbox.com">Mapbox</a>',
        id: 'examples.map-i875mjb7'});
    L.control.scale().addTo(map);
    var ggl = new L.Google('ROADMAP');
    var ggl2 = new L.Google('HYBRID');
    var ggl3 = new L.Google('SATELLITE');
    map.addLayer(osm);
    new L.Control.GeoSearch({
        provider: new L.GeoSearch.Provider.OpenStreetMap(),
        position: 'topright',
        showMarker: false
    }).addTo(map);
    mapLayers = {'Open Street Map': osm, 'Google': ggl, 'Google Satellite': ggl3, 'Google Hybrid': ggl2};
    var progress = document.getElementById('progress');
    var progressBar = document.getElementById('progress-bar');

    function updateProgressBar(processed, total, elapsed, layersArray) {
        if (elapsed > 1000) {
            // if it takes more than a second to load, display the progress bar:
            progress.style.display = 'block';
            progressBar.style.width = Math.round(processed / total * 100) + '%';
        }

        if (processed === total) {
            // all markers processed - hide the progress bar:
            progress.style.display = 'none';
        }
    }

    // [FitBounds]

    var markersCG = L.markerClusterGroup({chunkedLoading: false, chunkProgress: updateProgressBar});

    var markerList = [];

    var markerStart = L.icon({
        iconUrl: '[base]/ramblers/images/marker-start.png',
        iconSize: [22, 35]
    });
    var markerArea = L.icon({
        iconUrl: '[base]/ramblers/images/marker-area.png',
        iconSize: [22, 35]
    });
    var markerCancelled = L.icon({
        iconUrl: '[base]/ramblers/images/marker-cancelled.png',
        iconSize: [22, 35]
    });
    var walkingarea = L.icon({
        iconUrl: '[base]/ramblers/images/area.png',
        iconSize: [40, 35]
    });
    var walkinggroup = L.icon({
        iconUrl: '[base]/ramblers/images/group.png',
        iconSize: [40, 35]
    });
    var walkingspecial = L.icon({
        iconUrl: '[base]/ramblers/images/specialgroup.png',
        iconSize: [40, 35]
    });


    // [[Add markers here]]

    markersCG.addLayers(markerList);
    map.addLayer(markersCG);
    map.addControl(new L.Control.Layers(mapLayers));
}
;
window.onload = function () {
    raLoadLeaflet();
};