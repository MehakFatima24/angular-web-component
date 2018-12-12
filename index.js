$( document ).ready(function() {

    var mymap = L.map('mapid').setView([51.505, -0.09], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoibWVoYWsyNCIsImEiOiJjanBrdm80ZzUwNjF2NDhzNWg2MnJmdWE0In0.4jqPH4jw0JkRKLA6CNOCiw'
    }).addTo(mymap);
    var marker = L.marker([51.5, -0.09]).addTo(mymap);
    const Ventana = require('@sugarcrm/ventana');
    var settoken = function(key, value){
      localStorage.setItem(key, value);
    }
    var gettoken = function(key){
      return localStorage.getItem(key);
    }
    var cuttoken = function(key){
      localStorage.removeItem(key);
    }
    const SugarApi = Ventana.getInstance({
        serverUrl: 'http://192.168.3.143/lkw_walter/sugar/build_28112018/ent/sugarcrm/rest/v11_1',
        keyValueStore: { set: settoken, get: gettoken, cut: cuttoken},
        platform: 'portal',
        clientID: 'sugar',
    });
    var callbacks = {
    success: function(data) {
      console.log(data)
    },
    error: function(error) {
      console.log(error)
    },
    complete: function() {
    },
    };

    var params = {id: '3d5f7c1c-fdf6-11e8-8a1b-000000000000'};

    var records = SugarApi.records('read','lkw_Firma');


});
