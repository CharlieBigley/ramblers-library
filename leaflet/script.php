<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class RLeafletScript {

    private $command = 'noDirectAction';
    private $dataObject = null;

    public function __construct() {
        
    }

    public function setCommand($command) {
        $this->command = $command;
    }

    public function setDataObject($value) {
        $this->dataObject = $value;
    }

    public function add($options) {
        $document = JFactory::getDocument();
        $options->setLicenses();
        if ($this->command !== "noDirectAction") {
            echo "<div id='" . $options->divId . "'></div>" . PHP_EOL;
        }
        $text = "window.addEventListener('load', function () {" . PHP_EOL;
        $text .= "var mapOptions='" . addslashes(json_encode($options)) . "';" . PHP_EOL;
        // set data object for this command      
        if ($this->dataObject !== null) {
            $text .= "var data='" . addslashes(json_encode($this->dataObject)) . "';" . PHP_EOL;
        } else {
            $text .= "var data=null;" . PHP_EOL;
        }

        $text .= "ra.bootstrapper('" . $this->command . "',mapOptions,data);});" . PHP_EOL;
        $document->addScriptDeclaration($text, "text/javascript");

        $this->addScriptsandStyles($options);
    }

    private function addScriptsandStyles($options) {

        JHtml::_('jquery.framework');

        $document = JFactory::getDocument();

        RLoad::addScript("media/lib_ramblers/js/ra.js", array("type" => "text/javascript"));
        // Leaflet
        $document->addStyleSheet("media/lib_ramblers/vendors/leaflet/leaflet.css", array("type" => "text/css"));
        $document->addScript("media/lib_ramblers/vendors/leaflet/leaflet.js", array("type" => "text/javascript"));
        RLoad::addScript("media/lib_ramblers/leaflet/ra.leafletmap.js");
        RLoad::addStyleSheet("media/lib_ramblers/leaflet/ramblersleaflet.css");

        $path = "media/lib_ramblers/vendors/Leaflet.fullscreen-1.0.2/dist/";
        RLoad::addScript($path . "Leaflet.fullscreen.min.js");
        RLoad::addStyleSheet($path . "leaflet.fullscreen.css");

        if ($options->displayElevation !== null) {
            // elevation
            $document->addScript("https://d3js.org/d3.v3.min.js", array("type" => "text/javascript"));
            $path = "media/lib_ramblers/vendors/Leaflet.Elevation-0.0.4-ra/";
            $document->addScript($path . "leaflet.elevation-0.0.4.src.js", array("type" => "text/javascript"));
            $document->addStyleSheet($path . "elevation.css", array("type" => "text/css"));
            $document->addScript("media/lib_ramblers/vendors/leaflet-gpx-1.3.1/gpx.js", array("type" => "text/javascript"));
        }
        if (RLicense::isGoogleKeyMapSet()) {
            // Google
            //$document->addScript("https://maps.googleapis.com/maps/api/js?key=" . RLicense::getGoogleMapKey(), array("type"=>"text/javascript"), true, true);
            RLoad::addScript("media/lib_ramblers/vendors/Leaflet.GridLayer.GoogleMutant/Leaflet.GoogleMutant.js");
            RLoad::addScript("media/lib_ramblers/vendors/es6-promise-vv4.2.3/dist/es6-promise.auto.js");
            //    $document->map->replaceString("// [set addGoogle]", "ramblersMap.options.google=true;");
        }

        // clustering
        $path = "media/lib_ramblers/vendors/Leaflet.markercluster-1.5.3/dist/";
        RLoad::addStyleSheet($path . "MarkerCluster.css");
        RLoad::addStyleSheet($path . "MarkerCluster.Default.css");
        RLoad::addScript($path . "leaflet.markercluster.js");
        RLoad::addScript("media/lib_ramblers/vendors/Leaflet.FeatureGroup.SubGroup-1.0.2/src/subgroup.js");

        RLoad::addScript("media/lib_ramblers/leaflet/L.Control.Places.js");

        RLoad::addScript("media/lib_ramblers/leaflet/L.Control.Mouse.js");
        RLoad::addStyleSheet("media/lib_ramblers/leaflet/L.Control.Mouse.css");

        RLoad::addScript("media/lib_ramblers/vendors/Leaflet.Control.Resizer-0.0.1/L.Control.Resizer.js");
        RLoad::addStyleSheet("media/lib_ramblers/vendors/Leaflet.Control.Resizer-0.0.1/L.Control.Resizer.css");

        if ($options->mouseposition !== null or $options->osgrid !== null or $options->rightclick !== null) {
            // grid ref to/from lat/long
            RLoad::addScript("media/lib_ramblers/vendors/geodesy/vector3d.js");
            RLoad::addScript("media/lib_ramblers/vendors/geodesy/latlon-ellipsoidal.js");
            RLoad::addScript("media/lib_ramblers/vendors/geodesy/osgridref.js");
        }

        if (RLicense::isBingKeyMapSet()) {
            // Bing maps
            RLoad::addScript("media/lib_ramblers/vendors/bing/bing.js", array("type" => "text/javascript"));
        }


        $path = "media/lib_ramblers/vendors/leaflet.browser.print-1/dist/";
        RLoad::addScript($path . "leaflet.browser.print.js");
        //     $document->addScript($path . "leaflet.browser.print.sizes.js", array("type" => "text/javascript"));
        //     $document->addScript($path . "leaflet.browser.print.utils.js", array("type" => "text/javascript"));

        if ($options->calendar) {
            $path = "media/lib_ramblers/vendors/fullcalendar-5.9.0/lib/";
            RLoad::addScript($path . "main.js");
            RLoad::addStyleSheet($path . "main.css");
        }

        RLoad::addScript("media/lib_ramblers/js/ra.js");
        RLoad::addScript("media/lib_ramblers/js/ra.map.js");
        RLoad::addScript("media/lib_ramblers/js/ra.walk.js");
        // my location start
        RLoad::addScript("media/lib_ramblers/leaflet/L.Control.MyLocation.js");
        $document->addScript("https://cdn.jsdelivr.net/npm/leaflet.locatecontrol/dist/L.Control.Locate.min.js");
        $document->addStyleSheet("https://cdn.jsdelivr.net/npm/leaflet.locatecontrol/dist/L.Control.Locate.min.css");
        // my location finish

        RLoad::addScript("media/lib_ramblers/leaflet/L.Control.RAContainer.js");
        RLoad::addScript("media/lib_ramblers/leaflet/L.Control.Tools.js");
        RLoad::addScript("media/lib_ramblers/leaflet/L.Control.Search.js");

        // settings
        RLoad::addStyleSheet("media/lib_ramblers/leaflet/L.Control.Settings.css");
        RLoad::addScript("media/lib_ramblers/leaflet/L.Control.Settings.js");
        RLoad::addScript("media/lib_ramblers/js/ra.feedhandler.js");
        RLoad::addScript("media/lib_ramblers/vendors/FileSaver-js-1.3.8/src/FileSaver.js");
    }

    public static function registerWalks($walks) {
        // register walks from php methods into raWalks.js for display
        $data = new class {
            
        };
        $data->walks = $walks;
        $script = new RLeafletScript();
        $options = new RLeafletMapoptions();
        $script->setCommand("ra.walk.registerPHPWalks");
        $script->setDataObject($data);
        $script->add($options);
    }

}

// need to add json error handling when converting options and data to JSON

//       $list = json_encode($this->list);
//        if ($list === false) {
//            $err = "CSV FILE ERROR";
//            switch (json_last_error()) {
//                case JSON_ERROR_NONE:
//                    $err.= ' - No errors';
//                    break;
//                case JSON_ERROR_DEPTH:
//                    $err.= ' - Maximum stack depth exceeded';
//                    break;
//                case JSON_ERROR_STATE_MISMATCH:
//                    $err.= ' - Underflow or the modes mismatch';
//                    break;
//                case JSON_ERROR_CTRL_CHAR:
//                    $err.= ' - Unexpected control character found';
//                    break;
//                case JSON_ERROR_SYNTAX:
//                    $err.= ' - Syntax error, malformed JSON';
//                    break;
//                case JSON_ERROR_UTF8:
//                    $err.= ' - Malformed UTF-8 characters, possibly incorrectly encoded';
//                    break;
//                default:
//                    $err.= ' - Unknown error';
//                    break;
//            }
//            $app = JApplicationCms::getInstance('site');
//            $app->enqueueMessage(JText::_($err), 'error');
