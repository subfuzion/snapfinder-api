$("form#findform").submit(function(e){
    
    e.preventDefault();

    var zipcode = document.getElementById('zipcode').value;

    //alert(zipcode);

    $.ajax({
        type: 'GET',
        url: '/storelist/' + zipcode,
        complete: function(r){
		window.location.href = '/storelist/' + zipcode;
        }
        });  
  
});

$("form#findform2").submit(function(e){
 
    e.preventDefault();

    var zipcode = document.getElementById('zipcode').value;


    $.ajax({
        type: 'GET',
        url: '/storelist/' + zipcode,
        complete: function(r){
                window.location.href = '/storelist/' + zipcode;
        }
        });

});




