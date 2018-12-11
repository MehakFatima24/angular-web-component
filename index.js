$( document ).ready(function() {
    console.log( "ready!" );
    const Ventana = require('@sugarcrm/ventana');
    const SugarApi = Ventana.getInstance({
        serverUrl: 'https://staging.rtlabs.co.uk:44375/rest/v11_1',
        platform: 'portal',
        clientID: 'sugar',
        externalLoginUICallback: 'https://staging.rtlabs.co.uk:44375/',
    });
    // console.log(SugarApi.getMetadata());
   var cred =
    // Fetch `Accounts` records
    console.log(SugarApi.login({
      username: "admin",
      password: "admin"
    }));

});
