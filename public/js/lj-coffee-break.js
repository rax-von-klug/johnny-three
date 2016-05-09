/*
  Author: Lumberjacks
  Template: Coffee Break (Landing Page)
  Version: 1.0
  URL: http://themeforest.net/user/Lumberjacks/
*/

"use strict";

  $(document).ready(function (){

    // Setting default easing
    jQuery.easing.def = "easeInOutExpo";


    // Backgrounds
    $('.lj-app-buttons').backstretch("img/bg-module.jpg");
    $('.lj-ready').backstretch("img/bg-module.jpg");


    // Scroll to module after menu click 
    $("a.slide").on('click', function(e) {
      e.preventDefault();
      $('.menu-icon').removeClass('active');
      $('.lj-menu').removeClass('active');
      var $that = $(this).attr('href');
      if ($that == '#header') {
        $('html,body').animate({
          scrollTop: $("header").offset().top},
          1250);
      }
      else {
        $('html,body').animate({
          scrollTop: $("header").nextAll($that).offset().top-$('.lj-menu > .container').outerHeight(true)-50},
          1250);
      }
    });


    // Video frame
    $('#video-button').magnificPopup({
        type: 'iframe'
    });


    // quotes animator
    var ticker = $('.quote');
    var displayDuration = 6000;
    var aniIn = 'animated fadeIn';
    var aniOut =  'animated fadeOut';
    var onAnimationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
    ticker.children('div:first').show().siblings().hide();        
    setInterval(function() {
      ticker.find('div:visible').addClass(aniOut).one(onAnimationEnd, function() {
        $(this).css('display','none').removeClass(aniOut).appendTo(ticker);
        ticker.children('div:first').css('display', 'block').addClass(aniIn).one(onAnimationEnd, function(){
          $(this).removeClass(aniIn);
        });
      });
    }, displayDuration);


    // Mobile menu
    var windowWwidth = $(window).width() + getScrollBarWidth();
    var menu = $('.lj-menu');
    if (windowWwidth < 768 && !menu.hasClass('floating')) {
      menu.addClass('floating');
    }
    $('.menu-icon').on('click', function() {
      $(this).toggleClass('active');
      $('.lj-menu').toggleClass('active');
    });


    // Features gallery
    $(".image-carousel").owlCarousel({
      responsive : true,
      items: 6,
      itemsDesktop : [1000,5],
      itemsDesktopSmall : [900,3],
      itemsTablet: [600,2],
      itemsMobile : [400,2]
    });
    $('.image-link').magnificPopup({
      type: 'image',
      mainClass: 'mfp-with-zoom',
      zoom: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out',
      }
    });


    // E-mail validation
    function isValidEmailAddress(emailAddress) {
      var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
      return pattern.test(emailAddress);
    };


    // Ajax Subscription form
    $("#subscribe").submit(function (event) {
      var input = $('.lj-subscribe-message');
      if(!input.is(':empty')) {
        $('.lj-subscribe-message').stop(true);
      }
      event.preventDefault();
      event.stopImmediatePropagation();

      var email = $("input#subscribe-email").val();

      if (email == "") {

        $(".lj-subscribe-message").stop(true).html('<i class="fa fa-warning"></i> You must enter a valid e-mail address.');
        $("input#subscribe-email").focus();
      } 
      else if (!isValidEmailAddress( email )) {
        $(".lj-subscribe-message").stop(true).html('<i class="fa fa-warning"></i> E-mail address is not valid.');
        $("input#subscribe-email").focus();            
      }
      else {
        $.ajax({
          type: "POST",
          url: "./php/send-subscription.php",
          data: {subscription:email},
          success: function () {
            $(".lj-subscribe-message").html('<i class="fa fa-check"></i> We will be in touch soon!');
            $('input#subscribe-email').val('');
          }
        });
      }
    });


    // Tweetie
    $('.lj-twitter-feed').twittie({
      username: 'envato',
      count: 3,
      dateFormat: '%b %d',
      hideReplies: true,
      template: '<p><span>{{screen_name}}</span>{{tweet}}</p>',
      apiPath: 'twitter/api/tweet.php'
    }, function() {
      var ticker = $('.lj-twitter-feed ul');
      ticker.children('li:first').show().siblings().hide();        
      setInterval(function() {
        ticker.find('li:visible').fadeOut(500,function() {
          $(this).appendTo(ticker);
          ticker.children('li:first').fadeIn(500);
        });
      },5000);
    });


    // scrollbar width
    function getScrollBarWidth() {
      var inner = document.createElement('p');
      inner.style.width = "100%";
      inner.style.height = "200px";

      var outer = document.createElement('div');
      outer.style.position = "absolute";
      outer.style.top = "0px";
      outer.style.left = "0px";
      outer.style.visibility = "hidden";
      outer.style.width = "200px";
      outer.style.height = "150px";
      outer.style.overflow = "hidden";
      outer.appendChild (inner);

      document.body.appendChild (outer);
      var w1 = inner.offsetWidth;
      outer.style.overflow = 'scroll';
      var w2 = inner.offsetWidth;
      if (w1 == w2) w2 = outer.clientWidth;

      document.body.removeChild (outer);

      return (w1 - w2);
    };

    
    $(window).on('scroll', function() {
      var windowWidth = $(document).width() + getScrollBarWidth();
      var height = $(this).scrollTop();
      var topOffset = $(window).scrollTop();
      var menu = $('.lj-menu');
      var menuHeight = menu.outerHeight();
      if (windowWidth > 768 && topOffset > 500 && !menu.hasClass('floating')) {
        menu.addClass('floating').css({ top: -menuHeight-20 }).animate({
          top: '0'
        }, 500, 'easeOutExpo');
      }
      else if (windowWidth > 768 && topOffset <= 500 && menu.hasClass('floating')) {
        menu.removeClass('floating').css({ top: '0' });
      }
    });


    // Retina display
    $('img[data-retina-src]').retinaDisplay();


    // Resize functions
    $(window).resize(function() {

      var menu = $('.lj-menu');
      var windowWidth = $(document).width() + getScrollBarWidth();
      if (windowWidth < 768 && !menu.hasClass('floating')) {
        menu.addClass('floating');
      }
      else if (windowWidth >= 768 && menu.hasClass('floating') && $(window).scrollTop() <= 500) {
        menu.removeClass('floating');
      }

      if ($('.menu-icon').hasClass('active') && windowWidth >= 768) {
        $('.menu-icon').removeClass('active');
        menu.removeClass('active');
      }

    });

    $(window).load(function() {

      menu.css({ height: menu.outerHeight() });

    });

  });