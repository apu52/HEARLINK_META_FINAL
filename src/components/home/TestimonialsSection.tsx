import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    content:
      "HearLink has enhanced the quality of education at our university. With the real-time transcription facility, all students can better understand lectures. This technology is revolutionary for the Indian education system.",
    author: "Dr. Priya Sharma",
    role: "Professor, Indian Institute of Technology Delhi",
    image: "https://images.unsplash.com/photo-1622460241924-a114e6abe1ff?q=80&w=711&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
  {
    content:
      "As a student from rural Maharashtra, HearLink has bridged the language gap for me. The platform's ability to translate complex technical terms into Hindi has made engineering concepts much clearer. It is extremely helpful in my studies.",
    author: "Rahul Patil",
    role: "Engineering Student, University of Pune",
    image: "https://images.unsplash.com/photo-1660982741734-5a7d2730ff28?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
  {
    content:
      "In line with the Government of India's Digital India initiative, HearLink promotes accessibility in education. We have implemented it in 200+ colleges across the state and the results are excellent.",
    author: "Mrs. Anita Verma",
    role: "Education Secretary, Government of Uttar Pradesh",
    image: "https://images.unsplash.com/photo-1637176594894-13e5da4866e7?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
  {
    content:
      "Working in the tribal areas of Jharkhand, HearLink has been instrumental in making quality education accessible to indigenous students. The multilingual support and voice-to-text features have eliminated communication barriers completely.",
    author: "Dr. Aditya Singh",
    role: "Education Director, Tribal Welfare Department",
    image: "https://images.unsplash.com/photo-1570338652597-a6a2b7bcaf1b?q=80&w=686&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % testimonials.length);
          setIsAnimating(false);
        }, 300);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const nextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }
  };

  const goToSlide = (index: number) => {
    if (!isAnimating && index !== currentSlide) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Quote className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Indian Educators
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover why leading educational institutions and students across India choose HearLink
          </p>
        </div>

        {/* Main Testimonial Slider */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
            <div className="relative h-96 md:h-80">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0'
                      : index < currentSlide
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-0 translate-x-full'
                  } ${isAnimating ? 'transition-opacity duration-300' : ''}`}
                >
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
                      <div className="mb-6">
                        <Quote className="w-12 h-12 text-blue-200 mb-4" />
                        <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6 font-medium">
                          "{testimonial.content}"
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-1">
                            {testimonial.author}
                          </h4>
                          <p className="text-blue-600 font-medium">{testimonial.role}</p>
                        </div>
                        
                        <div className="flex space-x-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <svg
                              key={i}
                              className="w-5 h-5 text-yellow-400 fill-current"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-1/3 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700"></div>
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-full h-full object-cover mix-blend-overlay"
                      />
                      <div className="absolute inset-0 bg-blue-600 opacity-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-blue-50 transition-colors group"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-blue-50 transition-colors group"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center space-x-3 mb-16">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-blue-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Featured testimonial */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-8 md:mb-0 md:pr-12">
              <Quote className="w-12 h-12 text-blue-300 mb-6" />
              <h3 className="text-2xl md:text-3xl font-bold mb-6">
                HearLink has revolutionized how we approach inclusive education in India. It's not just a tool; it's breaking barriers and making quality education accessible to students across diverse linguistic and cultural backgrounds.
              </h3>
              <div>
                <p className="font-semibold text-xl">Prof. Rajesh Kumar</p>
                <p className="text-blue-200">Vice-Chancellor, Jawaharlal Nehru University</p>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1631911950144-5d6d45a73665?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Prof. Rajesh Kumar"
                className="w-48 h-198 md:w-64 md:h-64 rounded-full object-cover border-4 border-blue-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;