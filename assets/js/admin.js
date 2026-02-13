/**
 * NextDash Admin JavaScript
 */

(function($) {
  'use strict';

  // Wait for DOM and WordPress media library to be ready
  $(document).ready(function() {
    
    // Initialize color picker
    function initColorPicker() {
      if (typeof $.fn.wpColorPicker !== 'undefined') {
        $('.nextdash-color-picker').wpColorPicker({
          change: function(event, ui) {
            // Color changed
          }
        });
      } else {
        // Retry after a short delay if wpColorPicker isn't loaded yet
        setTimeout(initColorPicker, 100);
      }
    }
    
    // Initialize color picker
    initColorPicker();

    // Logo Upload
    var mediaUploader;
    
    $(document).on('click', '#nextdash_upload_logo', function(e) {
      e.preventDefault();
      
      // Check if wp.media is available
      if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
        alert('WordPress media library is not available. Please refresh the page.');
        return;
      }
      
      if (mediaUploader) {
        mediaUploader.open();
        return;
      }
      
      mediaUploader = wp.media({
        title: 'Choose Logo',
        button: {
          text: 'Use this logo'
        },
        multiple: false
      });
      
      mediaUploader.on('select', function() {
        var attachment = mediaUploader.state().get('selection').first().toJSON();
        $('#nextdash_logo_url').val(attachment.url);
        $('.nextdash-logo-preview').html('<img src="' + attachment.url + '" style="max-height: 60px; max-width: 200px;">');
        if ($('#nextdash_remove_logo').length === 0) {
          $('#nextdash_upload_logo').after('<button type="button" class="button" id="nextdash_remove_logo">Remove Logo</button>');
        }
      });
      
      mediaUploader.open();
    });
    
    // Remove Logo
    $(document).on('click', '#nextdash_remove_logo', function(e) {
      e.preventDefault();
      $('#nextdash_logo_url').val('');
      $('.nextdash-logo-preview').html('<p class="description">No logo selected</p>');
      $(this).remove();
    });

    // Settings form validation
    $('#nextdash-settings-form').on('submit', function(e) {
      // Add any form validation here
    });

    // Toggle sections
    $('.nextdash-section-toggle').on('change', function() {
      var section = $(this).data('section');
      console.log('Section toggled:', section);
    });
  });
  
})(jQuery);

