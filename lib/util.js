'use strict';

/**
 * Converts a lang tag (en-US, en, fr-CA) into an object with properties `country` and `locale`
 * @param str String a language tag in the format `en-US`, `en_US`, `en`, etc.
 * @returns {{locale: string, country: string}}
 */
exports.parseLangTag = function (str) {
    var pair, tuple;

    if (typeof str === 'object') {
        return str;
    }

    pair = {
        language: '',
        country: ''
    };

    if (str) {
        tuple = str.split(/[-_]/);
        pair.language = (tuple[0] || pair.language).toLowerCase();
        pair.country = (tuple[1] || pair.country).toUpperCase();
    }

    return pair;
};