var L, ra, document;
L.Control.MyLocation = L.Control.extend({
    options: {
        title: 'Display my location',
        position: 'topleft'
    },
    _userOptions: {
        panToLocation: false,
        marker: {
            radius: 5,
            color: '#0044DD'
        },
        accuracy: {
            display: false,
            fill: {
                color: '#F75E5E',
                opacity: .5
            }}
    },
    _controls: {
        panToLocation: null,
        marker: null,
        accuracy: {
            display: null,
            fill: null}
    },
    first: false,
    onAdd: function (map) {
        this._map = map;
        this.active = false;
        this.locationfound = false;
        this._map.myLocationLayer = L.featureGroup([]);
        this._map.myLocationLayer.addTo(this._map);
        var containerAll = L.DomUtil.create('div', 'leaflet-control  leaflet-control-my-location');
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control', containerAll);
        var containerStatus = L.DomUtil.create('div', 'status', containerAll);
        L.DomEvent.disableClickPropagation(containerAll);
        L.DomEvent.disableClickPropagation(containerStatus);
        this._createIcon(container);
        this._container = container;

        L.DomEvent.on(this.link, 'click', this._displaymylocationEvent, this);
        this.process = null;

        this._setTitle();
        this._appendButtons(containerStatus);
        this.statuson.style.display = "none";
        this.statusoff.style.display = "none";
        var self = this;
        document.addEventListener('accuratepositionprogress', function (e) {
            //console.log('GPX Progress');
            self._map.myLocationLayer.clearLayers();
            self.displayLocation(e.result, false);
        });
        document.addEventListener('accuratepositionfound', function (e) {
            // console.log('GPS position found');
            self._map.myLocationLayer.clearLayers();
            self.locationfound = true;
            self.displayLocation(e.result, true);
        });
        document.addEventListener('accuratepositionerror', function (e) {
            //console.log('Location error');
            self.locationfound = false;
        });
        return containerAll;
    },
    _createIcon: function (container) {
        this.link = L.DomUtil.create('a', '', container);
        this.link.title = this.options.title;
        return this.link;
    },
    _appendButtons: function (container) {
        this.holder = L.DomUtil.create('div', 'leaflet-my-location', container);
        this.statuson = L.DomUtil.create('div', 'status on', this.holder);
        this.statuson.innerHTML = "Location turned ON";

        this.statusoff = L.DomUtil.create('div', 'status off', this.holder);
        this.statusoff.innerHTML = "Location turned OFF";
    },
    changeDisplay: function (display) {
        this._container.style.display = display;
    },
    _displaymylocationEvent: function (evt) {
        this._map.myLocationLayer.clearLayers();
        this.active = !this.active;
        this._setTitle();
        if (this.active) {
            this._turnOnPositioning();
        } else {
            this._turnOffPositioning();
        }
    },

    _turnOnPositioning: function () {
        clearInterval(this.process);
        this.first = true;
        this.link.classList.add("active");
        ra.loc.getPosition({
            maxWait: 1000, // defaults to 10closem000
            desiredAccuracy: 20 // defaults to 20
        });
        this.process = null;
        this.process = setInterval(function () {
            ra.loc.getPosition({
                maxWait: 2000, // defaults to 10000
                desiredAccuracy: 20 // defaults to 20
            });
        }, 3000);
        var _this = this;
        this.statuson.style.display = 'inline-block';
        this.statusoff.style.display = 'none';
        setInterval(function () {
            _this.statuson.style.display = 'none';
        }, 2000);
    },
    _turnOffPositioning: function () {
        clearInterval(this.process);
        this.first = false;
        this.link.classList.remove("active");
        this.statuson.style.display = 'none';
        this.statusoff.style.display = 'inline-block';
        var _this = this;
        setInterval(function () {
            _this.statusoff.style.display = 'none';
        }, 2000);
    },
    _setTitle: function () {
        if (this.active) {
            this.link.title = this.options.title + ' - searching';
        } else {
            this.link.title = this.options.title;
        }
    },

    displayLocation: function (location, accurate) {
        if (this.active) {
            try {
                if (!accurate) {
                    if (location.position !== undefined) {
                        var pos = location.position.coords;
                        var latlng = L.latLng(pos.latitude, pos.longitude);
                        //console.log('lat ' + pos.latitude + ' long ' + pos.longitude);
                        var options = {radius: this._userOptions.marker.radius * 2, color: '#FF0000'};
                        var circleMarker = new L.CircleMarker(latlng, options);
                        this._map.myLocationLayer.addLayer(circleMarker);
                        circleMarker.bindPopup(popup);
                    }
                } else {
                    if (location.position !== undefined) {
                        var pos = location.position.coords;
                        var latlng = L.latLng(pos.latitude, pos.longitude);
                        //console.log('Lat ' + pos.latitude + ' Long ' + pos.longitude);
                        var popup = "Current location<br/>Accuracy is " + Math.ceil(pos.accuracy) + " metres";
                        if (pos.heading === null || isNaN(pos.heading)) {
                            var options = {radius: this._userOptions.marker.radius, color: this._userOptions.marker.color};
                            var circleMarker = new L.CircleMarker(latlng, options);
                            this._map.myLocationLayer.addLayer(circleMarker);
                            circleMarker.bindPopup(popup);
                        }
                        if (pos.heading !== null && isNaN(pos.heading) === false) {
                            var circleMarker = L.marker.arrowCircle(latlng, {
                                iconOptions: {color: this._userOptions.marker.color, rotation: pos.heading}});
                            this._map.myLocationLayer.addLayer(circleMarker);
                            circleMarker.bindPopup(popup);
                        }

                        if (this._userOptions.accuracy.display) {
                            var options = {radius: pos.accuracy, color: this._userOptions.accuracy.fill.color, opacity: this._userOptions.accuracy.fill.opacity, interactive: false, fill: true};
                            var circle = new L.Circle(latlng, options);
                            this._map.myLocationLayer.addLayer(circle);
                        }
                        if (this.first) {
                            this.first = false;
                            this._map.setView(latlng, 16);
                        }
                        if (this._userOptions.panToLocation) {
                            this._map.panTo(latlng);
                        }
                    }
                }
            } catch (err) {
                this.statusoff.innerHTML = err.message;
                this.statusoff.style.display = 'inline-block';
            }
            // console.log("Location displayed");
        }
    },
    settingsForm: function (tag) {
        var _this = this;
        var hdg1 = document.createElement('h5');
        hdg1.textContent = 'My Location Options';
        tag.appendChild(hdg1);
        this._controls.marker = ra.html.input.colour(tag, '', 'Colour of My Location marker', this._userOptions.marker, 'color');
        this._controls.panToLocation = ra.html.input.yesNo(tag, '', "Keep location at centre of map", this._userOptions, 'panToLocation');
        tag.appendChild(document.createElement('hr'));
        this._controls.accuracy.display = ra.html.input.yesNo(tag, '', "Display circle showing accuracy of location", this._userOptions.accuracy, 'display');
        var accuracy = document.createElement('div');
        tag.appendChild(accuracy);
        if (_this._userOptions.accuracy.display) {
            accuracy.style.display = 'inherit';
        } else {
            accuracy.style.display = 'none';
        }
        this._controls.accuracy.display.addEventListener("ra-input-change", function (e) {
            if (_this._userOptions.accuracy.display) {
                accuracy.style.display = 'inherit';
            } else {
                accuracy.style.display = 'none';
            }
        });
        this._controls.accuracy.fill = ra.html.input.fillStyle(accuracy, '', '', this._userOptions.accuracy.fill);
        tag.appendChild(document.createElement('hr'));
        var comment = document.createElement('p');
        comment.innerHTML = 'Unfortunately browser technology does not allow the location to be found if the browser is not active. ' +
                'When using a smart phone the browser cannot access the location if the device goes into standby mode.';
        tag.appendChild(comment);

    },
    resetSettings: function () {
        ra.html.input.colorReset(this._controls.marker, '#0044DD');
        ra.html.input.yesNoReset(this._controls.panToLocation, false);
        ra.html.input.yesNoReset(this._controls.accuracy.display, false);
        ra.html.input.fillStyleReset(this._controls.accuracy.fill, {
            color: '#F75E5E',
            opacity: 0.5});
    },
    _readSettings: function () {
        ra.settings.read('__mylocation', this._userOptions);

    },
    saveSettings: function (save) {
        ra.settings.save(save, '__mylocation', this._userOptions);
    }
});
L.control.mylocation = function (options) {
    return new L.Control.MyLocation(options);
};
