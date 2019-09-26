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
  
  // Image hover
  $(".icon").mouseenter(function(){
    $(".icon").attr("src", "https://raw.githubusercontent.com/marcodsman/marcodsman.github.io/master/img/glitch-icon-hover.png")
  });
  $(".icon").mouseleave(function(){
    $(".icon").attr("src", "https://raw.githubusercontent.com/marcodsman/marcodsman.github.io/master/img/glitch-icon-white-transparent.png")
  });
});
