
import React, { useState } from "react";
import SectionHeading from "@/components/ui/section-heading";
import img1 from "/images/Blee_featured.jpg"
import img2 from "/images/koshish3.jpg"
const images = [
  {
    src: img1,
    alt: "Students collaborating in classroom",
    title: "Collaborative Learning",
    category: "Classroom",
  },
  {
    src: "https://images.unsplash.com/photo-1699495592088-f63b5d1b1e83?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Teacher giving presentation",
    title: "Interactive Lectures",
    category: "Teaching",
  },
  {
    src: "https://images.unsplash.com/photo-1589451826010-186507b962a3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Student using tablet for learning",
    title: "Digital Learning Tools",
    category: "Technology",
  },
  {
    src: img2,
    alt: "Student with headphones studying",
    title: "Audio Learning",
    category: "Accessibility",
  },
  {
    src: "https://plus.unsplash.com/premium_photo-1726880460027-fab1b079b37a?q=80&w=1126&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Educational workshop",
    title: "Hands-on Workshops",
    category: "Events",
  },
  {
    src: "https://images.unsplash.com/photo-1682203533347-10b924b3c253?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Students in library",
    title: "Research Resources",
    category: "Library",
  },
];

const categories = ["All", "Classroom", "Teaching", "Technology", "Accessibility", "Events", "Library"];

const GallerySection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredImages = activeCategory === "All"
    ? images
    : images.filter(image => image.category === activeCategory);

  const openLightbox = (src: string) => {
    setSelectedImage(src);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = "auto";
  };

  return (
    <section id="gallery" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="HearLink Gallery"
          subtitle="Explore our platform in action, empowering students and educators across different learning environments"
        />

        <div className="flex flex-wrap justify-center mb-8 gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-hearlink-600 text-white"
                  : "bg-white text-hearlink-800 hover:bg-hearlink-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
              onClick={() => openLightbox(image.src)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h3 className="text-white text-xl font-bold">{image.title}</h3>
                <p className="text-gray-200 text-sm">{image.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-hearlink-300 transition-colors"
            onClick={closeLightbox}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Enlarged view"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default GallerySection;
