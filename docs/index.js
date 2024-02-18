// ******************** Declare Variables ********************

// ************************ JS Starts ************************
sliderListener();
topNavbarListener();

// ******************** Declare Functions ********************
function sliderListener() {
    var sliderPos = 0;
    const slides = document.getElementById("slides");
    const slidesCount = slides.children.length;
    const leftSliderButton = document.getElementById("left_slider_button");
    const rightSliderButton = document.getElementById("right_slider_button");

    function updateSlider(direction) {
        sliderPos += direction;
        slides.style.transform = `translateX(${100 * sliderPos}%)`;

        leftSliderButton.classList.toggle("disabled", sliderPos === 0);
        rightSliderButton.classList.toggle("disabled", sliderPos === -slidesCount + 1);
    }

    leftSliderButton.onclick = () => updateSlider(1);
    rightSliderButton.onclick = () => updateSlider(-1);
}

function topNavbarListener() {
    // When scrolling darken the background of top bar
    const navbar = document.getElementById("top_bar");
    window.onscroll = function () {
        if (document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
            navbar.classList.add("darken");
        } else {
            navbar.classList.remove("darken");
        }
    };

    // On mobile devices widen-up the top bar on the click of the button
    const menuButton = document.getElementById("top_bar_open_menu_button");
    menuButton.onclick = function () {
        navbar.classList.toggle("open");
    };

    // On mobile devices close/narrow the top bar when clicking one of the links (href)
    navbar.onclick = function (event) {
        if (event.target.tagName.toLowerCase() === "a") {
            navbar.classList.remove("open");
        }
    };

    // On mobile devices if the clicked location outside of topbar, close/narrow the top bar
    window.onclick = function (event) {
        if (!event.target.closest("#top_bar")) {
            navbar.classList.remove("open");
        }
    };
}
