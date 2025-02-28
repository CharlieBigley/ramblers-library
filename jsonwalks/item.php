<?php

// no direct access
defined('_JEXEC') or die('Restricted access');

/**
 * Description of items
 *
 * @author Chris Vaughan
 */
class RJsonwalksItem {

    public $text;

    function __construct($value) {
        if (isset($value)) {
            if (property_exists($value, "text")) {
                $this->text = $value->text;
            }
        }
    }
    public function getName() {
        return $this->text;
    }

}
