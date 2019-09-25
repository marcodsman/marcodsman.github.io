$(document).ready(function(){
  // Hide extra projects
  $(".extra-projects").hide();
  
  $(".more-less").click(function(){
    if($(".more-less-text").text() == "More"){
      $(".more-less-text").text("Less");
      $(".extra-projects").show();
    } else {
      $(".more-less-text").text("More");
      $(".extra-projects").hide();
    }
  });
});
