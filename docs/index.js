// ******************** Declare Variables ********************

// ************************ JS Starts ************************
sliderListener();

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
    };
    
    leftSliderButton.onclick = () => updateSlider(1);
    rightSliderButton.onclick = () => updateSlider(-1);
}
