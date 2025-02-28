var ra, displayCustomValues, OsGridRef, LatLon;
if (typeof (ra) === "undefined") {
    ra = {};
}
if (typeof (ra.data) === "undefined") {
    ra.data = {};
}
ra.walk = (function () {
    var my = {};
    my.DisplayWalkFunction = "ra.walk.displayWalkID";
    my.mapFormat = ["{dowddmm}", "{;title}", "{,distance}"];
    my.mapLinks = ["{startOSMap}", "{startDirections}"];
    my._startup = true;
    my.walks = {};
    my.testcsv = function () {
        var allText = [];
        var allTextLines = [];
        //var Lines = [];
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "places.csv", true);
        xhttp.onload = function () {
            allText = xhttp.responseText;
            allTextLines = allText.split(/\r\n|\n/);
            var arrayLength = allTextLines.length;
            for (var i = 1; i < arrayLength; i++) {
                var line = allTextLines[i];
                var items = line.split(',');
                var gr = items[3];
                var lat = items[7];
                var lng = items[6];

                var latlng = LatLon(lat, lng, LatLon.datum.WGS84);
                var gr2 = OsGridRef.latLonToOsGrid(latlng);
                var gridref2 = gr2.toString(6);

                if (gridref2 !== gr) {
                    console.log("GR from lat.long not equal to supplied value: " + gr + "/" + gridref2 + ' : ' + line + '\n');
                }
            }

        };
        xhttp.send();

    };
    my.registerWalks = function (walks) {
        // my.testcsv();
        var i, no, walk;
        for (i = 0, no = walks.length; i < no; ++i) {
            walk = walks[i];
            my.walks[walk.id] = walks[i];
            var error = my._locationDiagnostics(walks[i]);
            if (error !== '') {
                console.log(error);
            }
        }
        if (my._startup) {
            my._startup = false;
            setTimeout(function () {
                // check url parameters and display walk in popup
                my._displayWalkPopup();
            }, 1500);
        }

    };
    my.registerPHPWalks = function (mapOptions, data) {
        // stores walks for php walks displays
        var _allwalks = null;
        _allwalks = ra.walk.convertPHPWalks(data.walks);
        if (_allwalks !== null) {
            my.registerWalks(_allwalks);
        }
        this.load = function () {

        };
    };
    my._displayWalkPopup = function () {
        var search = window.location.search;
        const urlParams = new URLSearchParams(search);
        if (urlParams.has('walkid')) {
            var walkid = urlParams.getAll('walkid')[0];
            my.displayWalkID(new Event("dummy"), walkid);
        }
    };
    my.getWalk = function (id) {
        if (my.walks.hasOwnProperty(id)) {
            return my.walks[id];
        }
        return null;
    };
    my.displayWalkID = function (event, id) {
        my._getWalkObject(event, id, my._displayModalWalk);
    };
    my.toggleDisplay = function (event, id) {
        var tag = event.currentTarget;
        if (tag.className.includes('doing')) {
            return;
        }
        if (tag.className.includes('active')) {
            tag.classList.remove("active");
            tag.nextElementSibling.remove();
        } else {
            tag.classList.add("active");
            tag.classList.add("doing");
            var info = {tag: tag,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey
            };
            my._getWalkObject(info, id, my._displayDivWalk);
        }
    };
    my._displayDivWalk = function (event, walk) {
        var tag = event.tag;
        var div = document.createElement("div");
        ra.html.insertAfter(tag, div);
        var html;
        if (event.ctrlKey && event.altKey) {
            html = my.walkDiagnostics(walk);
        } else {
            html = my.walkDetails(walk);
        }
        div.innerHTML = html;
        my._addMaptoWalk(walk);
        tag.classList.remove("doing");
    };
    my._displayModalWalk = function (event, walk) {
        var html;
        if (event.ctrlKey && event.altKey) {
            html = my.walkDiagnostics(walk);
        } else {
            html = my.walkDetails(walk);
        }
        var modal = ra.modals.createModal(html);
        my._addMaptoWalk(walk);
        var tag = modal.headerDiv();
        if (tag !== null) {
            my._addDiaryButton(tag, walk);
        }
    };
    my._addDiaryButton = function (tag, walk) {
        var diary = document.createElement('button');
        diary.setAttribute('class', 'link-button tiny cloudy');
        diary.title = 'Download an .ICS file, import to Diary';
        diary.textContent = 'Add to Calendar';
        tag.parentNode.insertBefore(diary, tag);
        diary.addEventListener('click', function () {
            walk.display = true;
            var $walks = [walk];
            ra.walk.icsfile.create($walks);
        });
    };
    my._getWalkObject = function (event, id, callback) {
        var walk = my.getWalk(id);
        if (walk !== null) {
            callback(event, walk);
            return;
        }
        alert('SORRY unable to display specified walk, we will attempt to view walk on National Site');
        $url = "https://www.ramblers.org.uk/go-walking/find-a-walk-or-route/walk-detail.aspx?walkID=" + id;
        window.open($url);
    };
    my._addMaptoWalk = function (walk) {
        if (my.isCancelled(walk)) {
            return;
        }
        var tag = document.getElementById("div" + walk.id);
        var lmap = new ra.leafletmap(tag, ra.defaultMapOptions);
        var map = lmap.map;
        var layer = L.featureGroup().addTo(map);
        if (walk.finishLocation) {
            my._addLocation(layer, walk.finishLocation, map);
        }
        if (walk.startLocation) {
            my._addLocation(layer, walk.startLocation, map);
        }
        if (walk.meetLocation) {
            my._addLocation(layer, walk.meetLocation, map);
        }
        var bounds = layer.getBounds();
        map.fitBounds(bounds, {maxZoom: 15, padding: [20, 20]});
//        fix contact link does not work if popup is underneath it and it is in coloumn two
//        var elems = document.getElementsByClassName("walkcontact");
//        elems[0].addEventListener('mouseover', function () {
//            map.closePopup();
//        });
    };
    my._addLocation = function (layer, location, map) {
        var icon = ra.map.icon.markerRoute();
        var popup = "", title = '';
        var popupoffset = [0, -30];
        if (location.exact) {
            if (location.postcode !== null) {
                if (location.postcodeDistance < 10000) {
                    var pcpop = "<b>" + location.postcode + "</b>";
                    pcpop += "<br/>" + location.type + " location is " + location.postcodeDistance + " metres to the " + location.postcodeDirection;
                    var pcIcon = ra.map.icon.postcode();
                    var marker = L.marker([location.postcodeLatitude, location.postcodeLongitude], {icon: pcIcon, riseOnHover: true}).addTo(layer);
                    marker.bindPopup(pcpop).closePopup();
                }
            }
        }
        if (location.exact) {
            switch (location.type) {
                case "Meeting":
                    popup = "<b>Meeting place</b><br/>" + location.timeHHMMshort + " " + location.description;
                    popup += "<br/>" + location.gridref;
                    icon = ra.map.icon.markerRoute();
                    title = 'Meeting place';
                    popupoffset = [0, -30];
                    break;
                case "Start":
                    popup = "<b>Walk start</b><br/>" + location.timeHHMMshort + " " + location.description;
                    popup += "<br/>" + location.gridref;
                    icon = ra.map.icon.markerStart();
                    title = 'Start of walk';
                    popupoffset = [0, -10];
                    break;
                case "Finishing":
                case "End":
                    popup = "<b>Walk Finish</b><br/>" + location.description;
                    icon = ra.map.icon.markerFinish();
                    title = 'End of walk';
                    popupoffset = [0, -10];
                    break;
            }
        } else {
            switch (location.type) {
                case "Meeting":
                case "Finishing":
                case "End":
                    return;
                    break;
                case "Start":
                    var popup = "<b>General area for walk only</b><br/>" + location.description;
                    popup += "<br/>Contact group if you wish to join the walk at the start";
                    icon = ra.map.icon.markerArea();
                    title = 'General area of walk';
                    popupoffset = [0, -10];
                    break;
            }
        }
        var marker = L.marker([location.latitude, location.longitude], {icon: icon, title: title, riseOnHover: true}).addTo(layer);
        marker.bindPopup(popup, {offset: popupoffset, autoClose: false}).closePopup();
        //  marker.closePopup();
        var openPopups = true;
        // keepInView so popup in not under contact links as link does not work/available
        map.on("mouseover", function (event) {
            if (openPopups) {
                marker.openPopup();
            }
            openPopups = false;
        });
        map.on("mouseout", function (event) {
            marker.closePopup();
            openPopups = true;
        });
    };
    my.displayWalkURL = function (url) {
        window.open(url);
    };
// display walks 
    my.walkDetails = function ($walk) {
        var PHP_EOL = "\n";
        var $html = "";
        var $link, $out, $text;
        $html += "<div class='walkstdfulldetails stdfulldetails walk" + $walk.status + "' >" + PHP_EOL;
        $html += "<div class='walkitem group " + my.gradeCSS($walk.nationalGrade) + "'><b>Group</b>: " + $walk.groupName + "</div>" + PHP_EOL;
        if (my.isCancelled($walk)) {
            $html += "<div class='walkitem reason'>WALK CANCELLED: " + $walk.cancellationReason + "</div>" + PHP_EOL;
        }
        $html += "<div class='walkitem basics'>" + PHP_EOL;
        $html += "<div class='description'><b><span class='walktitle'>" + $walk.title + "</span><br/>" + my.getWalkValue($walk, '{dowddmm}') + PHP_EOL;
        $html += "</b></div>" + PHP_EOL;
        if ($walk.description !== "") {
            $html += "<div class='description'> " + $walk.descriptionHtml + "</div>" + PHP_EOL;
        }
        if ($walk.additionalNotes !== "") {
            $html += "<div class='additionalnotes'><b>Additional Notes</b>: " + $walk.additionalNotes + "</div>" + PHP_EOL;
        }
        if ($walk.external_url !== null && $walk.external_url !== "")
        {
            $html += "<div><b>Website:</b>&nbsp;<a href='" + $walk.external_url + "' target='_blank'>" + $walk.external_url + "</a><br/></div>" + PHP_EOL;
        }
        if ($walk.isLinear) {
            $html += "<b>Linear Walk</b>";
        } else {
            $html += "<b>Circular walk</b>";
        }
        if ($walk.hasMeetPlace) {
            $out = "<div><b>Meeting time " + $walk.meetLocation.timeHHMMshort + "</b></div>";
            $html += $out + PHP_EOL;
        }
        if ($walk.startLocation !== null)
        {
            if ($walk.startLocation.exact) {
                $out = "<div><b>Start time " + $walk.startLocation.timeHHMMshort + "</b></div>";
                $html += $out + PHP_EOL;
            }
        }
        if ($walk.finishTime !== null) {
            $out = "<div>(Estimated finish time " + ra.time.HHMMshort($walk.finishTime) + ")</div>";
            $html += $out + PHP_EOL;
        }
        $html += "</div>";
        if ($walk.hasMeetPlace) {
            $html += "<div class='walkitem meetplace'>";
            $out = _addLocationInfo("Meeting", $walk.meetLocation);
            $html += $out;
            $html += "</div>" + PHP_EOL;
        }
        if ($walk.startLocation !== null)
        {
            if ($walk.startLocation.exact) {
                $html += "<div class='walkitem startplace'>";
            } else {
                $html += "<div class='walkitem nostartplace'><b>No start place - Rough location only</b>: ";
            }
            $html += _addLocationInfo("Start", $walk.startLocation);
            $html += "</div>" + PHP_EOL;
        }
        if ($walk.isLinear) {
            $html += "<div class='walkitem finishplace'>";
            if ($walk.finishLocation !== null) {
                $html += _addLocationInfo("Finish", $walk.finishLocation);
            } else {
                $html += "<span class='walkerror' >Linear walk but no finish location supplied</span>";
            }
            $html += "</div>" + PHP_EOL;
        }
        $html += "<div class='walkitem difficulty'><b>Walk</b>: ";
        if ($walk.distanceMiles > 0) {
            $html += ra.html.addDiv("distance", "<b>Distance</b>: " + $walk.distanceMiles + "mi / " + $walk.distanceKm + "km");
        }
        $html += ra.html.addDiv("nationalgrade", "<b>National Grade</b>: " + $walk.nationalGrade + "  " + ra.walk.grade.disp($walk.nationalGrade, 'popup'));
        if ($walk.localGrade !== "") {
            $link = $walk.localGrade;
            $html += ra.html.addDiv("localgrade", "<b>Local Grade</b>: " + $link);
        }
        if ($walk.pace !== "") {
            $html += ra.html.addDiv("pace", "<b>Pace</b>: " + $walk.pace);
        }
        if ($walk.ascentFeet !== null) {
            $html += ra.html.addDiv("ascent", "<b>Ascent</b>: " + $walk.ascentMetres + " m/" + $walk.ascentFeet + " ft");
        }
        $html += "</div>" + PHP_EOL;
        $html += "<div class='walkitem walk'>";
        if ($walk.isLeader === false) {
            $html += "<b>Contact Details: </b>";
        } else {
            $html += "<b>Contact Leader: </b>";
        }
        // Only display the name if we have one.
        if (($walk.contactName == "") && ($walk.email == "") && ($walk.telephone1 + $walk.telephone2 == ""))
        {
            $html += ra.html.addDiv("contactname", "<b>No contact details available</b>");
        }
        else
        {
            $name = $walk.contactName !== "" ? "<b>Name</b>: " + $walk.contactName : "";
            $html += ra.html.addDiv("contactname", $name);
            if ($walk.email !== "") {
                $html += my.getEmailLink($walk);
            }
            if ($walk.telephone1 + $walk.telephone2 !== "") {
                $text = "<b>Telephone</b>: ";
                if ($walk.telephone1 !== "") {
                    $text += $walk.telephone1;
                    if ($walk.telephone2 !== "") {
                        $text += ", ";
                    }
                }
                if ($walk.telephone2 !== "") {
                    $text += $walk.telephone2;
                }
                $html += ra.html.addDiv("telephone", $text);
            }
            if ($walk.isLeader === false) {
                if ($walk.walkLeader !== "") {
                    $html += "<div class='walkleader'><b>Walk Leader</b>: " + $walk.walkLeader + "</div>" + PHP_EOL;
                }
            }
        }
        $html += "</div>" + PHP_EOL;
        var mapdiv = "div" + $walk.id;
        $html += "<div class='walkitem map' id='" + mapdiv + "'></div>" + PHP_EOL;
        $html += my.addFlagInfo($walk.flags);

        if ($walk.media.length > 0) {
            if ($walk.media.length > 0) {
                $html += "<div class='walkitem walkmedia' >";
                var index, len;
                for (index = 0, len = $walk.media.length; index < len; ++index) {
                    var item = $walk.media[index];
                    var caption = "<div>";
                    if (item.caption !== "") {
                        caption += item.caption;
                    }
                    if (item.copyright !== "") {
                        caption += "<br/><i>&copy; " + item.copyright + "</i>";
                    }
                    caption += "</div>";
                    $html += "<div class='walk-image' onclick='ra.html.displayInModal(this)'><img class='walkmedia' src='" + item.url + "'  >" + caption + "</div>";
                }
                $html += "</div>" + PHP_EOL;
            }
        }


        $html += "<div class='walkitem walkdates'>" + PHP_EOL;
        if ($walk.detailsPageUrl !== '') {
            $html += "<div class='updated'><a href='" + $walk.detailsPageUrl + "' target='_blank' >View walk on National Web Site</a></div>" + PHP_EOL;
        }
        $html += "<div class='updated'>Walk ID " + $walk.id + "</div>" + PHP_EOL;
        //var link = window.location.href + "&walkid=" + $walk.id;
        var url = new URL(window.location.href);
        var params = new URLSearchParams(url.search);
        params.delete("walkid");
        params.append("walkid", $walk.id);
        var link = new URL(`${url.origin}${url.pathname}?${params}`);
        var text = escape(link.href);
        $html += "<div>" + PHP_EOL;
        $html += "<img src=\"" + ra.baseDirectory() + "media/lib_ramblers/leaflet/images/share.png\" alt=\"Share\" width=\"25\" height=\"25\"> " + PHP_EOL;
        $html += "<a href=\"javascript:ra.clipboard.set(\'" + text + "')\" >Copy url of this popup to clipboard</a>" + PHP_EOL;
        $html += "</div>" + PHP_EOL;
        $html += "<div class='updated walk" + $walk.status + "'>Last update: " + ra.date.dowShortddmmyyyy($walk.dateUpdated) + "</div>" + PHP_EOL;
        $html += "</div>" + PHP_EOL;



        $html += "</div>" + PHP_EOL;
        //    var mapdiv = "div" + $walk.id;
        //    $html += "<div class='walkitem map' id='" + mapdiv + "'></div>" + PHP_EOL;
        return $html;
    };
    my.getWalkValues = function ($walk, $items, link = true) {
        var index, len, out, lastItem, thisItem;
        var options;
        out = "";
        lastItem = '';
        for (index = 0, len = $items.length; index < len; ++index) {

            options = getPrefix($items[index]);
            thisItem = my.getWalkValue($walk, options.walkValue);
            if (lastItem !== '' && thisItem !== '') {
                out += options.previousPrefix;
            }
            if (thisItem !== "") {
                out += options.prefix;
            }
            out += thisItem;
            lastItem = thisItem;
        }
        if (out === '') {
            return out;
        }
        if (link) {
            return my.addWalkLink($walk.id, out);
        } else {
            return  out;
    }

    };
    my.addFlagInfo = function (items) {
        var $html = "";
        var lastSection = '';
        if (items.length > 0) {
            $html += "<div class='walkitem'>";

            var index, len;
            for (index = 0, len = items.length; index < len; ++index) {
                var item = items[index];
                var section = item.section;
                if (lastSection !== section) {
                    if (lastSection !== '') {
                        $html += "</ul>";
                    }
                    $html += "<b>" + section + "</b>";
                    lastSection = section;
                    $html += "<ul>";

                }
                $html += "<li class='item'>" + item.name + "</li>";
            }
            $html += "</ul></div>";
        }
        return $html;
    };
//    my.addItemInfo = function ($class, $title, $value) {
//        var $html = "";
//        var $any = false;
//        var $text;
//        if ($value !== null) {
//            $html += "<div class='walkitem " + $class + "'><b>" + $title + "</b>";
//            $html += "<ul>";
//            var $items = $value.items;
//            var index, len;
//            for (index = 0, len = $items.length; index < len; ++index) {
//                $text = $items[index].text;
//                if ($text !== "") {
//                    $html += "<li class='item'>" + $text + "</li>";
//                    $any = true;
//                }
//            }
//            $html += "</ul></div>";
//        }
//        if (!$any) {
//            $html = "";
//        }
//        return $html;
//    };
    my.getEmailLink = function ($walk) {
        var $link;
        //   $link = "javascript:ra.walk.emailContact(\"" + $walk.id + "\")";
        //  return "<span><a href='" + $link + "' title='Click to send an email to leader/contact'>Email contact</a></span>";
        var $gwemlink;
        if ($walk.email === "") {
            return "";
        }
        if ($walk.contactForm !== "") {
            $link = "<span><b>Contact link: </b><a target='_blank' href='" + $walk.contactForm + "' title='Click to send an email to leader/contact or group'>Email contact</a></span>";
        } else {
            $gwemlink = "javascript:ra.walk.emailContact(\"" + $walk.id + "\")";
            $link = "<span><a href='" + $gwemlink + "' title='Click to send an email to leader/contact'>Email contact</a></span>";
        }
        return $link;
    };
    my.emailContact = function ($id) {

        var url = 'https://sendemail.ramblers-webs.org.uk';
        //var url = 'https://sendemail02.ramblers-webs.org.uk';
        //var url = 'http://localhost/contactForm';

        var $walk = my.getWalk($id);
        var data = {};
        data.key = $walk.key;
        data.group = $walk.groupName;
        data.title = $walk.title;
        data.date = ra.date.dowShortddmmyyyy($walk.walkDate);
        var frameDiv = '<div id="raContactDiv"></div>';
        var modal = ra.modals.createModal(frameDiv);
        //    ra.modal.display(frameDiv);
        var div = document.getElementById("raContactDiv");
        var frame = document.createElement('iframe');
        frame.setAttribute('class', 'ra contactForm');
        frame.setAttribute('src', url);
        frame.setAttribute('title', 'Contact group about group walk');
        div.appendChild(frame);
        // Create IE + others compatible event handler
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
        // Listen to message from child window
        eventer(messageEvent, function (e) {
            var height = parseInt(e.data);
            if (height > 0) {
                frame.style.height = height + "px";
            }
            //console.log('parent received message!:  ', e.data);
        }, false);
        frame.onload = function () {
            //console.log(" frame.onload ");
            var sentThis = JSON.stringify(data);
            frame.contentWindow.postMessage(sentThis, url);
        };
    };
    my.walkDiagnostics = function ($walk) {
        var options = ["{lf}", "{group}", "{dowShortdd}", "{dowShortddmm}", "{dowShortddyyyy}",
            "{dowShortddmmyyyy}", "{dowdd}", "{dowddmm}", "{dowddmmyyyy}", "{meet}",
            "{meetTime}", "{meetPlace}", "{meetGR}", "{meetPC}", "{meetOLC}", "{meetMapCode}",
            "{start}", "{startTime}", "{startPlace}", "{startGR}", "{startPC}", "{startOLC}",
            "{startMapCode}", "{finishTime}", "{title}", "{description}", "{difficulty}", "{difficulty+}",
            "{distance}", "{distanceMi}", "{distanceKm}", "{gradeimg}", "{gradeimgRight}",
            "{grade}", "{grade+}", "{nationalGrade}", "{nationalGradeAbbr}", "{localGrade}",
            "{additionalNotes}", "{type}", "{contact}", "{contactname}", "{contactperson}", "{telephone}",
            "{telephone1}", "{telephone2}", "{email}", "{emailat}", "{emaillink}", "{mediathumbr}",
            "{mediathumbl}",
            "{meetOSMap}", "{meetDirections}", "{startOSMap}", "{startDirections}"];
        var index, len, option, $value;
        var $html;
        $html = "<table><tr><th style='min-width: 30px;'>No</th><th  style='min-width: 120px;'>Name</th><th>Value</th><th>HTML</th></tr>";
        for (index = 0, len = options.length; index < len; ++index) {
            option = options[index];
            $html += "<tr>";
            $value = my.getWalkValue($walk, option);
            $html += "<td>" + index + "</td><td>" + option + "</td><td>" + $value + "</td><td>" + $value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            +"</td>";
            $html += "</tr>";
        }
        $html += "</table>";
        $html += "<pre>" + JSON.stringify($walk, undefined, 4) + "</pre>";
        return  my._locationDiagnostics($walk) + $html;
    };
    my._locationDiagnostics = function ($walk) {
        var out = "";
        if ($walk.hasMeetPlace) {
            out += my._locationAccuray('Meet', $walk.meetLocation);
        }
        if ($walk.startLocation !== null)
        {
            if ($walk.startLocation.exact) {
                out += my._locationAccuray('Start', $walk.startLocation);
            }    
        }
        return out;
    };
    my._locationAccuray = function (type, location) {
        if (location.gridref != "")
        {
            var out = "";
            var gridref1 = OsGridRef.parse(location.gridref).toString(6);
            var latlng = LatLon(location.latitude, location.longitude, LatLon.datum.WGS84);
            var gr = OsGridRef.latLonToOsGrid(latlng);
            var gridref2 = gr.toString(6);
            var gridref3 = gr.toString(8);
            if (gridref2 !== location.gridref) {
                out = "<p>Error in " + type + "GR from lat.long not equal to supplied value: " + gridref1 + "/" + gridref2 + '/' + gridref3 + '</p>\n';
            }
        }
        else
        {
            out = "";
        }
        return out;
    };
    my.getWalkValue = function ($walk, $option) {
        var BR = '<br/>';
        var out = "";
        switch ($option) {
            case "{lf}":
                out = BR;
                break;
            case "{group}":
                out = $walk.groupName;
                break;
            case "{dowShortdd}":
                out = "<b>" + ra.date.dowShortdd($walk.walkDate) + "</b>";
                break;
            case "{dowShortddmm}":
                out = "<b>" + ra.date.dowShortddmm($walk.walkDate) + my.addYear($walk) + "</b>";
                break;
            case "{dowShortddyyyy}": // published in error
            case "{dowShortddmmyyyy}":
                out = "<b>" + ra.date.dowShortddmmyyyy($walk.walkDate) + "</b>";
                break;
            case "{dowdd}":
                out = "<b>" + ra.date.dowdd($walk.walkDate) + "</b>";
                break;
            case "{dowddmm}":
                out = "<b>" + ra.date.dowddmm($walk.walkDate) + my.addYear($walk) + "</b>";
                break;
            case "{dowddmmyyyy}":
                out = "<b>" + ra.date.dowddmmyyyy($walk.walkDate) + "</b>";
                break;
            case "{meet}":
                if ($walk.hasMeetPlace) {
                    out = $walk.meetLocation.timeHHMMshort;
                    if ($walk.meetLocation.description) {
                        out += " at " + $walk.meetLocation.description;
                    }
                }
                break;
            case "{meetTime}":
                if ($walk.hasMeetPlace) {
                    out = $walk.meetLocation.timeHHMMshort;
                }
                break;
            case "{meetPlace}":
                if ($walk.hasMeetPlace) {
                    out = $walk.meetLocation.description;
                }
                break;
            case "{meetGR}":
                if ($walk.hasMeetPlace) {
                    out = $walk.meetLocation.gridref;
                }
                break;
            case "{meetPC}":
                if ($walk.hasMeetPlace) {
                    if ($walk.meetLocation.postcode !== null) {
                        out = $walk.meetLocation.postcode;
                    }
                }
                break;
            case "{meetOLC}":
                break;
            case "{meetMapCode}":
                break;
            case "{start}":
                if ($walk.startLocation !== null)
                {
                    if ($walk.startLocation.exact) {
                        out = $walk.startLocation.timeHHMMshort;
                        if ($walk.startLocation.description) {
                            out += " at " + $walk.startLocation.description;
                        }
                    }
                }
                break;
            case "{startTime}":
                if ($walk.startLocation !== null)
                {
                    if ($walk.startLocation.exact) {
                        out = $walk.startLocation.timeHHMMshort;
                    }
                }
                break;
            case "{startPlace}":
                if ($walk.startLocation !== null)
                {
                    if ($walk.startLocation.exact) {
                        if ($walk.startLocation.description) {
                            out += $walk.startLocation.description;
                        }
                    }
                }
                break;
            case "{startGR}":
                if ($walk.startLocation !== null)
                {
                    if ($walk.startLocation.exact) {
                        out = $walk.startLocation.gridref;
                    }
                }
                break;
            case "{startPC}":
                if ($walk.startLocation !== null)
                {
                    if ($walk.startLocation.exact) {
                        if ($walk.startLocation.postcode !== null) {
                            out = $walk.startLocation.postcode;
                        }
                    }
                }
                break;
            case "{startOLC}":
                break;
            case "{finishTime}":
                if ($walk.finishTime !== null) {
                    out = ra.time.HHMMshort($walk.finishTime);
                }
                break;
            case "{startMapCode}":
                break;
            case "{title}":
                // out = ra.html.addslashes($walk.title);
                out = $walk.title;
                out = "<b>" + out + "</b>";
                break;
            case "{description}":
                out = $walk.description;
                break;
            case "{distance}":
                if ($walk.distanceMiles > 0) {
                    out = $walk.distanceMiles + "mi / " + $walk.distanceKm + "km";
                }
                break;
            case "{distanceMi}":
                if ($walk.distanceMiles > 0) {
                    out = $walk.distanceMiles + "mi";
                }
                break;
            case "{distanceKm}":
                if ($walk.distanceMiles > 0) {
                    out = $walk.distanceKm + "km";
                }
                break;
            case "{difficulty}":
                out = my.getWalkValue($walk, "{distance}");
                out += "<br/><span class='pointer' onclick='ra.walk.dGH()' title='Click to see grading system'>" + $walk.nationalGrade + "</span>";
                if ($walk.localGrade !== "") {
                    if ($walk.localGrade.localeCompare($walk.nationalGrade) != 0)
                    {
                        out += BR + $walk.localGrade;
                    }
                }
                break;
            case "{difficulty+}":
                out = my.getWalkValue($walk, "{distance}");
                out += BR + ra.walk.grade.disp($walk.nationalGrade, "middle") + BR;
                out += "<span class='pointer' onclick='ra.walk.dGH()' title='Click to see grading system'>" + $walk.nationalGrade + "</span>";
                if ($walk.localGrade !== "") {
                    if ($walk.localGrade.localeCompare($walk.nationalGrade) != 0)
                    {
                        out += BR + $walk.localGrade;
                    }
                }
                break;
            case "{gradeimg}":
                out = ra.walk.grade.disp($walk.nationalGrade, 'details');
                break;
            case "{gradeimgRight}":
                out = ra.walk.grade.disp($walk.nationalGrade, 'right');
                break;
            case "{gradeimgMiddle}":
                out = ra.walk.grade.disp($walk.nationalGrade, 'middle');
                break;
            case "{grade}":
                out = "<span class='pointer " + $walk.nationalGrade.replace("/ /g", "") + "' onclick='ra.walk.dGH()' title='Click to see grading system'>" + $walk.nationalGrade + "</span>";
                if ($walk.localGrade !== "") {
                    if ($walk.localGrade.localeCompare($walk.nationalGrade) != 0)
                    {
                        out += BR + $walk.localGrade;
                    }
                }
                break;
            case "{grade+}":
                out = "";
                out += ra.walk.grade.disp($walk.nationalGrade, "middle");
                out += "<span class='pointer " + $walk.nationalGrade.replace("/ /g", "") + "' onclick='ra.walk.dGH()' title='Click to see grading system'>" + $walk.nationalGrade + "</span>";
                if ($walk.localGrade !== "") {
                    if ($walk.localGrade.localeCompare($walk.nationalGrade) != 0)
                    {
                        out += BR + $walk.localGrade;
                    }
                }
                break;
            case "{nationalGrade}":
                out = "<span class='pointer' onclick='ra.walk.dGH()'>" + $walk.nationalGrade + "</span>";
                break;
            case "{nationalGradeAbbr}":
                out = "<span class='pointer' onclick='ra.walk.dGH()'>" + ra.walk.grade.abbr($walk.nationalGrade) + "</span>";
                break;
            case "{localGrade}":
                out = $walk.localGrade;
                break;
            case "{additionalNotes}":
                out = $walk.additionalNotes;
                break;
            case "{type}":
                if ($walk.isLinear) {
                    out = "Linear";
                } else {
                    out = "Circular";
                }
                break;
            case "{contact}":
                var $titlePrefix = '';
                out = "";
                if ($walk.isLeader) {
                    $titlePrefix = "Leader ";
                } else {
                    $titlePrefix = "Contact ";
                }
                if ($walk.contactName !== "") {
                    out += " <b>" + $walk.contactName + "</b>";
                }
                if ($walk.email !== "") {
                    out += BR + my.getEmailLink($walk);
                }
                if ($walk.telephone1 !== "") {
                    out += BR + $walk.telephone1;
                }
                if ($walk.telephone2 !== "") {
                    out += BR + $walk.telephone2;
                }
                if (out !== '') {
                    out = $titlePrefix + out;
                }
                break;
            case "{contactname}":
                if ($walk.contactName !== '') {
                    if ($walk.isLeader) {
                        out = "Leader ";
                    } else {
                        out = "Contact ";
                    }
                    out += "<b>" + $walk.contactName + "</b>";
                }
                break;
            case "{contactperson}":
                out = $walk.contactName;
                break;
            case "{telephone}":
            case "{telephone1}":
                if ($walk.telephone1 !== "") {
                    out += $walk.telephone1;
                }
                break;
            case "{telephone2}":
                if ($walk.telephone2 !== "") {
                    out += $walk.telephone2;
                }
                break;
            case "{email}":
            case "{emailat}":
                var $contact = "";
                if ($walk.email !== "") {
                    $contact += my.getEmailLink($walk);
                }
                out = $contact;
                break;
            case "{emaillink}":
                if ($walk.email !== "") {
                    out = my.getEmailLink($walk);
                }
                break;
            case "{mediathumbr}":
                out = '';
                if ($walk.media.length > 0) {
                    out = "<img class='mediathumbr' src='" + $walk.media[0].url + "' >";
                }
                break;
            case "{mediathumbl}":
                out = '';
                if ($walk.media.length > 0) {
                    out = "<img class='mediathumbl' src='" + $walk.media[0].url + "' >";
                }
                break;
            case "{meetOSMap}":
                if ($walk.hasMeetPlace) {
                    var $lat = $walk.meetLocation.latitude;
                    var $long = $walk.meetLocation.longitude;
                    //      out = "<span><a href='javascript:ra.link.streetmap(" + $lat + "," + $long + ")' >[OS Map]</a></span>";
                    out = ra.link.getOSMap($lat, $long, "OS Map");
                }
                break;
            case "{meetDirections}":
                if ($walk.hasMeetPlace) {
                    var $lat = $walk.meetLocation.latitude;
                    var $long = $walk.meetLocation.longitude;
                    out = ra.loc.directionsSpan($lat, $long);
                }
                break;
            case "{startOSMap}":
                if ($walk.startLocation.exact) {
                    var $lat = $walk.startLocation.latitude;
                    var $long = $walk.startLocation.longitude;
                    //      out = "<span><a href='javascript:ra.link.streetmap(" + $lat + "," + $long + ")' >[OS Map]</a></span>";
                    out = ra.link.getOSMap($lat, $long, "OS Map");
                }
                break;
            case "{startDirections}":
                if ($walk.startLocation.exact) {
                    var $lat = $walk.startLocation.latitude;
                    var $long = $walk.startLocation.longitude;
                    out = ra.loc.directionsSpan($lat, $long);
                }
                break;
            default:
                var $found = false;
                var $response = "";
                if (typeof displayCustomValues === 'function') {
                    if ($option.startsWith("{x")) {
                        $response = displayCustomValues($option, $walk);
                        $found = $response.found;
                    }
                }
                if ($found) {
                    out += $response.out;
                } else {
                    $option = $option.replace("{", "");
                    out = $option.replace("}", "");
                }
        }

        return out;
    };
    getPrefix = function (walkOption) {
        var options = {};
        options.previousPrefix = '';
        options.prefix = "";
        options.walkValue = walkOption;
        var $loop = true;
        do {
            switch (options.walkValue.substr(0, 2)) {
                case "{;":
                    options.prefix += '<br/>';
                    options.walkValue = options.walkValue.replace("{;", "{");
                    break;
                case "{,":
                    options.prefix += ", ";
                    options.walkValue = options.walkValue.replace("{,", "{");
                    break;
                case "{[":
                    var $close = options.walkValue.indexOf("]");
                    if ($close > 0) {
                        options.prefix += options.walkValue.substr(2, $close - 2);
                        options.walkValue = "{" + options.walkValue.substr($close + 1);
                    } else {
                        options.prefix += options.walkValue;
                        options.walkValue = "{}";
                    }
                    break;
                case "{<":
                    var $close = options.walkValue.indexOf(">");
                    if ($close > 0) {
                        options.previousPrefix += options.walkValue.substr(2, $close - 2);
                        options.walkValue = "{" + options.walkValue.substr($close + 1);
                    } else {
                        options.previousPrefix += options.walkValue;
                        options.walkValue = "{}";
                    }
                    break;
                default:
                    $loop = false;
            }
        } while ($loop);
        return options;
    };
    my._addWalkLink = function (id, $text, $class = "") {
        if ($text !== '') {
            return  "<span class='pointer " + $class + "' onclick=\"" + my.DisplayWalkFunction + "(event,'" + id + "')\" title='Click to display walk details'>" + $text + "</span>";
        }
        return $text;
    };
    my.addWalkLink = function (id, $text, $class = "") {
        // split into text before and after span
        var st, en;
        var start = '';
        st = $text.indexOf("<span");
        en = $text.indexOf("/span>") + 6;
        if (st > -1 && en > st) {
            if (st > 0) {
                //var a = $text;
                // var _start = $text.substring(0, st);
                start = my._addWalkLink(id, $text.substring(0, st), $class);
            }
            var middle = $text.substring(st, en);
            //  var _end = $text.substr(en);
            var end = my.addWalkLink(id, $text.substr(en), $class);
            return start + middle + end;
        } else {
            return   my._addWalkLink(id, $text, $class);
    }

    };
    my.addTooltip = function ($walk, $text) {
        if ($text === '') {
            return $text;
        }
        if ($walk.status.toLowerCase() === "cancelled") {
            return "<span data-descr='Walk Cancelled' class=' walkCancelled'>" + $text + "</span>";
        }
        if ($walk.status.toLowerCase() === "new") {
            return "<span data-descr='Walk updated " + ra.date.dowShortddmmyyyy($walk.dateUpdated) + "' class=' walkNew'>" + $text + "</span>";
        }
        return $text;
    };
    my.addYear = function ($walk) {
        var d = new Date();
        var newDate = new Date(d.getTime() + 300 * 24 * 60 * 60000);
        var walkDate = ra.date.getDateTime($walk.walkDate);
        if (walkDate.getTime() < newDate.getTime()) {
            return '';
        } else {
            return ' ' + ra.date.YYYY(walkDate);
        }
    };
    _addLocationInfo = function ($title, $location) {
        var $out, $gr;
        if ($location.exact) {
            $out = "<div class='place'><b>" + $title + " Place</b>: " + $location.description + " ";
            $out += my._addDirectionsMap($location, "Google directions");
            $out += "</div>";
            if ($location.time !== "") {
                $out += ra.html.addDiv("time", "<b>Time</b>: " + $location.timeHHMMshort);
            }
            $gr = "<b>Grid Ref</b>: " + $location.gridref + " ";
            $gr += ra.link.getOSMap($location.latitude, $location.longitude, "OS Map");
            $out += ra.html.addDiv("gridref", $gr);
            $out += ra.html.addDiv("latlong", "<b>Latitude</b>: " + $location.latitude.toFixed(5) + " , <b>Longitude</b>: " + $location.longitude.toFixed(5));
            var tagname = "ra-loc=" + $location.type;
            var tag = document.getElementById(tagname);
            if (tag !== null) {
                tag.remove();
            }
            $out += '<span id="' + tagname + '"></span>';
            // getWhat3Words($location.latitude, $location.longitude, tagname,true);
            setTimeout(function () {
                ra.w3w.get($location.latitude, $location.longitude, tagname, false);
            }, 500);
            if ($location.postcode !== null) {
                $out += _displayPostcode($location);
            }
            if ($location.type === "Meeting") {
                $out += ra.html.addDiv("location notes", "Walkers will travel together from the meeting place to the start of the walk, this may be by car, coach or public transport. Meeting times are often when the group will set off, rather than when you should arrive at the meeting place.");
            }
            if ($location.type === "Start") {
                $out += ra.html.addDiv("location notes", "Start times are often when the group will start walking rather than when to get there.");
            }

        } else {
            if ($location.type === "Start") {
                $out = "<div class='place'>";
                $out += "Location shown is an indication of where the walk will be and <b>NOT</b> the start place: ";
                $out += ra.map.getMapLink($location.latitude, $location.longitude, "Map of area");
                $out += "<br/>Contact group if you wish to meet at the start";
                if ($location.timeHHMMshort !== '') {
                    $out += "<div class='starttime'>Start time: " + $location.timeHHMMshort + "</div>";
                }
                //  if ($this.displayStartDescription) {
                $out += "<div class='startdescription'>" + $location.description + "</div>";
                //  }

                $out += "</div>";
            }
        }

        return $out;
    };
    _displayPostcode = function ($location) {
        var $pc, $note2, $note, $distclass, $out;
        var $this = $location;
        var $dist = $this.postcodeDistance;
        //var $direction = $this.postcodeDirection;
        if ($dist <= 100) {
            $note = $this.postcode;
            $note2 = "Postcode is within 100m of location";
            $distclass = " distclose";
        } else {
            $note = "Location is " + $location.postcodeDistance.toFixed() + " metres to the " + $location.postcodeDirection + " of " + $this.postcode;
            $note2 = "Check postcode suitablility on map";
            if ($dist < 500) {
                $distclass = " distnear";
            } else {
                $distclass = " distfar";
            }
            if ($dist > 10000) {
                $note = $this.postcode;
                $note2 = 'Postcode distance from location not known';
            }
        }
        $pc = "<b>Postcode</b>: <abbr title='" + $note2 + "'>" + $note + "</abbr>";
        $out = ra.html.addDiv("postcode " + $distclass, $pc);
        return $out;
    };
    my._addDirectionsMap = function ($location, $text) {
        var $this = $location;
        var $loc, $out;
        if ($this.exact) {
            $loc = "[lat],[long]";
            $loc = $loc.replace("[lat]", $this.latitude);
            $loc = $loc.replace("[long]", $this.longitude);
            $out = "<span class='mappopup' onClick=\"javascript:ra.loc.directions(" + $loc + ")\" >[" + $text + "]</span>";
            return $out;
        } else {
            return "";
        }

    };
    my.isCancelled = function (walk) {
        return walk.status.toLowerCase() === "cancelled";
    };
    my.convertPHPWalks = function ($walks) {
        if ($walks === null) {
            return null;
        }
        var index, len, $walk;
        for (index = 0, len = $walks.length; index < len; ++index) {
            $walk = $walks[index];
            try {
                $walk.description = ra.convert_mails($walk.description);
                $walk.descriptionHtml = ra.convert_mails($walk.descriptionHtml);
                $walk.dateUpdated = $walk.dateUpdated.date;
                $walk.dateCreated = $walk.dateCreated.date;
                $walk.walkDate = $walk.walkDate.date;
                // delete $walk.day;
                // delete $walk.dayofweek;
                if ($walk.hasMeetPlace) {
                    my.convertPHPLocation($walk.meetLocation);
                }
                if ($walk.startLocation !== null)
                {
                    my.convertPHPLocation($walk.startLocation);
                }
                else{
                    console.warn("Error: Start Location not provided for walk " + $walk.id + " (" + $walk.groupCode + " - " + $walk.walkDate.substring(0,10) + " - " + $walk.title + ")");
                }
                if ($walk.finishTime !== null) {
                    $walk.finishTime = $walk.finishTime.date;
                }
            }    
            catch(err) {
                // Log that the walk failed to be converted.
                console.warn("(ra.walks.convertPHPWalks) Walk id (" + "[" + $walk.groupCode + "]" + $walk.id + " on " + $walk.walkDate.substring(0,10) + " - " + $walk.title + ") Failed to be converted due to error - " + err);
            }
        }
        return $walks;
    };
    my.convertPHPLocation = function (location) {
        if (location.time.hasOwnProperty('date')) {
            location.time = ra.date.getDateTime(location.time.date);
        } else {
            location.time = null;
        }

    };
    my.addWalkMarker = function (cluster, $walk, walkClass) {
        var $long, $lat, $icon, $class;
        var $popup;
        //  var $this = this.settings;
        if ($walk.startLocation !== null)
        {
            $long = $walk.startLocation.longitude;
            $lat = $walk.startLocation.latitude;
            if ($walk.startLocation.exact) {
                $icon = ra.map.icon.markerStart();
            } else {
                $icon = ra.map.icon.markerArea();
            }
            if (ra.walk.isCancelled($walk)) {
                $icon = ra.map.icon.markerCancelled();
            }
            $popup = document.createElement('div');
            var summary = document.createElement('div');
            summary.setAttribute('class', 'pointer');
            summary.innerHTML = ra.walk.getWalkValues($walk, my.mapFormat, false);
            var id = $walk.id;
            summary.addEventListener("click", function (e) {
                cluster.turnOffFullscreen();
                ra.walk.displayWalkID(e, id);
            });
            var link = document.createElement('div');
            link.innerHTML = ra.walk.getWalkValues($walk, my.mapLinks, false);
            var grade = document.createElement('div');
            grade.setAttribute('class', 'pointer');
            grade.style.float = "right";
            grade.innerHTML = my.grade.image($walk.nationalGrade) + "<br/>" + $walk.nationalGrade;
            grade.addEventListener("click", function (e) {
                cluster.turnOffFullscreen();
                ra.walk.dGH();
            });
            $popup.appendChild(grade);
            $popup.appendChild(summary);
            $popup.appendChild(link);
            var dist = '';
            if ($walk.distanceMiles > 0) {
                dist = $walk.distanceMiles + "mi / " + $walk.distanceKm + "km";
            }
            var title = ra.date.dowShortddmm($walk.walkDate) + ra.walk.addYear($walk) + ", " + dist;
            $class = walkClass + $walk.status;
            cluster.addMarker($popup, $lat, $long, {icon: $icon, title: title, riseOnHover: true});
        }
        return;
    };
    my.gradeCSS = function (nationalGrade) {
        var $class = "";
        switch (nationalGrade) {
            case "Easy Access":
                $class = "grade-ea";
                break;
            case "Easy":
                $class = "grade-e";
                break;
            case "Leisurely":
                $class = "grade-l";
                break;
            case "Moderate":
                $class = "grade-m";
                break;
            case "Strenuous":
                $class = "grade-s";
                break;
            case "Technical":
                $class = "grade-t";
                break;
            default:
                break;
        }
        return $class;
    };
    my.dGH = function () {
        var $url;
        $url = ra.baseDirectory() + "media/lib_ramblers/pages/grades.html";
        var marker;
        ra.ajax.postUrl($url, "", marker, _displayGradesModal);
    };
    _displayGradesModal = function (marker, $html) {
        $html = $html.replace(/basedirectory/g, ra.baseDirectory());
        ra.modals.createModal($html);
    };
    my.icsfile = (function () {
        var icsfile = {};
        icsfile.create = function ($walks) {

            var index, len, $walk;
            var events = new ra.ics.events();

            for (index = 0, len = $walks.length; index < len; ++index) {
                $walk = $walks[index];
                if ($walk.display) {
                    ra.walk.icsfile._addWalktoIcs($walk, events);
                }
            }
            events.download();
        };
        icsfile._addWalktoIcs = function (walk, events) {
            var ev = new ra.ics.event();
            var $meetLocation, $startLocation, $before, $after, $summary, $description, $altDescription;
            if (walk.hasMeetPlace) {
                var meet = new ra.gwemLocation(walk.meetLocation);
                $meetLocation = meet.getTextDescription();
                $meetLocation += "; <br/>";
            } else {
                $meetLocation = "";
            }
            if (typeof walk.startlocation !== 'undefined')
            {
                var start = new ra.gwemLocation(walk.startLocation);
                $startLocation = start.getTextDescription();    
            } else {
                $startLocation = "";
            }
            $before = $meetLocation + $startLocation + "<br/>Description: ";
            $after = "<br/>Contact: " + walk.contactName + " (" + walk.telephone1 + " " + walk.telephone2 + "); <br/>";
            if (walk.localGrade !== "") {
                if (walk.localGrade.localeCompare(walk.nationalGrade) != 0)
                {
                    $after += "Grade: " + walk.localGrade + "/" + walk.nationalGrade + "; <br/> ";
                } else {
                    $after += "Grade: " + walk.nationalGrade + "; <br/> ";
                }
            } else {
                $after += "Grade: " + walk.nationalGrade + "; <br/> ";
            }
            $after += walk.detailsPageUrl;
            $after += "<br/>Note: Finish times are very approximate!";
            if (walk.additionalNotes !== '') {
                $after += "<br/>Notes: " + walk.additionalNotes;
            }
            $summary = walk.title;
            if (walk.distanceMiles > 0) {
                $summary += ", " + walk.distanceMiles + "mi/" + walk.distanceKm + "km";
            }
            if (walk.status.toLowerCase() === 'cancelled') {
                ev.method("CANCEL");
                $summary = " CANCELLED " + $summary;
                $description = "CANCELLED - REASON: " + walk.cancellationReason + " (" + walk.description + ")";
            } else {

                $description = $before + walk.description + $after;
                $altDescription = $before + walk.descriptionHtml + $after;
            }

            var $time = icsfile._getFirstTime(walk);
            var d = ra.date.getDateTime(walk.walkDate);
            if ($time !== null) {
                $time.setDate(d.getDate());
                $time.setMonth(d.getMonth());
                $time.setFullYear(d.getFullYear());
                ev.startDate($time);
                $time = icsfile._getFinishTime(walk);
                if ($time !== null) {
                    ev.endDate(new Date($time));
                }
            } else {
                ev.startDate(ra.date.getDateTime(walk.walkDate));
            }

            ev.createdDate(ra.date.getDateTime(walk.dateCreated));
            ev.modifiedDate(ra.date.getDateTime(walk.dateUpdated));
            ev.uid('walk' + walk.id + '-isc@ramblers-webs.org.uk');
            ev.organiser(walk.groupName + ":mailto:ignore@ramblers-webs.org.uk");
            ev.summary($summary);
            ev.description($description);
            ev.altDescription($altDescription);
            ev.location($startLocation);
            ev.url(walk.detailsPageUrl);
            ev.categories("Walk," + walk.groupName);
            ev.class('PUBLIC');

            events.addEvent(ev);
        };
        icsfile._getFirstTime = function (walk) {
            var time = null;
            if (walk.hasMeetPlace) {
                time = walk.meetLocation.time;
            }
            if (time !== null) {
                return time;
            }
            time = walk.startLocation.time;
            return time;
        };
        icsfile._getLastTime = function (walk) {
            var time = null;
            if (walk.hasMeetPlace) {
                time = walk.meetLocation.time;
            }
            if (walk.startLocation.exact === true) {
                time = walk.startLocation.time;
            } else {

            }
            return time;
        };

        icsfile._getFinishTime = function (walk) {
            if (walk.finishTime !== null) {
                return walk.finishTime;
            }
            // calculate end time
            var $lasttime = icsfile._getLastTime(walk);
            if ($lasttime !== null) {
                var $durationFullMins = Math.ceil(walk.distanceMiles / 2) * 60;
                if (walk.startLocation.exact === false) {
                    $durationFullMins += 60;
                }
                $lasttime = ra.time.addMinutes($lasttime, $durationFullMins);
            }
            return $lasttime;
        };
        return icsfile;
    }
    ());
    my.grade = (function () {
        var grade = {};
        // get abbreviation from National Grade
        grade.abbr = function (nationalGrade) {
            switch (nationalGrade) {
                case "Easy Access":
                    return "EA";
                case "Easy":
                    return "E";
                case "Leisurely":
                    return "L";
                case "Moderate":
                    return "M";
                case "Strenuous":
                    return "S";
                case "Technical":
                    return "T";
                default:
                    return "";
            }
        };
        grade.colour = function (nationalGrade) {
            switch (nationalGrade) {
                case "Easy Access":
                    return "#ADADAD";
                case "Easy":
                    return "#9BC8AB";
                case "Leisurely":
                    return "#F6B09D";
                case "Moderate":
                    return "#F08050";
                case "Strenuous":
                    return "#F9B104";
                case "Technical":
                    return "#404141";
                default:
                    return "";
            }
        };
        grade.image = function (nationalGrade) {
            var $url = ra.baseDirectory() + "media/lib_ramblers/images/grades/";
            switch (nationalGrade) {
                case "Easy Access":
                    $url = "<img src='" + $url + "ea.png' alt='Easy Access' height='30' width='30'>";
                    break;
                case "Easy":
                    $url = "<img src='" + $url + "e.png' alt='Easy' height='30' width='30'>";
                    break;
                case "Leisurely":
                    $url = "<img src='" + $url + "l.png' alt='Leisurely' height='30' width='30'>";
                    break;
                case "Moderate":
                    $url = "<img src='" + $url + "m.png' alt='Moderate' height='30' width='30'>";
                    break;
                case "Strenuous":
                    $url = "<img src='" + $url + "s.png' alt='Strenuous' height='30' width='30'>";
                    break;
                case "Technical":
                    $url = "<img src='" + $url + "t.png' alt='Technical' height='30' width='30'>";
                    break;
            }
            return $url;
        };
        grade.disp = function (nationalGrade, $class) {
            var $tag = "";
            var $img = grade.image(nationalGrade);
            var dataDescr = "";
            switch (nationalGrade) {
                case "Easy Access":
                    dataDescr = 'Easy Access';
                    break;
                case "Easy":
                    dataDescr = 'Easy';
                    break;
                case "Leisurely":
                    dataDescr = 'Leisurely';
                    break;
                case "Moderate":
                    dataDescr = 'Moderate';
                    break;
                case "Strenuous":
                    dataDescr = 'Strenuous';
                    break;
                case "Technical":
                    dataDescr = 'Technical';
                    break;
                default:
                    break;
            }
            $tag = "<span data-descr='" + dataDescr + "' class='grade " + $class + "' onclick='ra.walk.dGH()' title='Click to see grading system'>" + $img + "</span>";

            return $tag;
        };
        return grade;
    }
    ());
    return my;
}
());

ra.gwemLocation = function (location) {
    this.loc = location;
    this.description = function () {
        return this.loc.description;
    };
    this.getTextDescription = function () {
        var $textdescription = "";
        switch (this.loc.type) {
            case "Meeting":
                $textdescription = "Meet: ";
                break;
            case "Start":
                if (this.loc.exact) {
                    $textdescription = "Start: ";
                } else {
                    $textdescription = "Walking area: ";
                }
                break;
            case "End":
                $textdescription = "Finish: ";
                break;
        }
        if (this.loc.exact) {
            if (this.loc.timeHHMMshort !== "") {
                $textdescription += this.loc.timeHHMMshort + " @ ";
            }
        }
        // CHANGE REQUIRED , remove postcode and reduce GR to two figures if not exact
        // CHANGE REQUIRED , remove postcode and reduce GR to two figures if not exact
        // CHANGE REQUIRED , remove postcode and reduce GR to two figures if not exact
        var $place = this.loc.gridref;
        if (this.loc.postcode !== null) {
            $place += ", " + this.loc.postcode;
        }
        if (this.loc.description !== '') {
            $textdescription += this.loc.description + ' (' + $place + ')';
        } else {
            $textdescription += $place;
        }
        return $textdescription;
    };
};
