import React, { useEffect, useState } from "react";
import { BookOpenIcon, LockClosedIcon } from "@heroicons/react/outline"; // Use LockClosedIcon for locked content
import { useCourseContext } from "../../../Context/CourseContext"; // Importing the custom hook
import { useUser } from "../../../Context/UserContext"; // Custom hook to access user data

// Reusable SubjectCard Component
const SubjectCard = ({ title, chapters, icon, onClick }) => (
  <div
    className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    onClick={onClick} // Trigger onClick to show chapters
  >
    <div className="flex justify-center mb-4">
      <div className="w-12 h-12 text-black">{icon}</div>
    </div>
    <h3 className="text-lg font-semibold mb-2 text-black">{title}</h3>
    <p className="text-sm text-black">{chapters} Chapters</p>
  </div>
);

// Reusable ChapterCard Component
const ChapterCard = ({ title, content, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white cursor-pointer shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow duration-300"
  >
    <h4 className="text-md font-semibold mb-2 capitalize text-black">{title}</h4>
    <p className="text-sm text-black">{content}</p>
  </div>
);


const TabContent = ({ videos = [], notes = [], isLocked }) => {
  const [activeTab, setActiveTab] = useState("videos");

  return (
    <div>
      <div className="flex mb-4">
        <button
          className={`px-4 py-2 ${
            activeTab === "videos" ? "bg-black text-white" : "bg-gray-200 text-black"
          } rounded-l`}
          onClick={() => setActiveTab("videos")}
        >
          Videos
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "notes" ? "bg-black text-white" : "bg-gray-200 text-black"
          } rounded-r`}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
      </div>

      {activeTab === "videos" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos?.length > 0 ? (
            videos.map((video, index) => (
              <div
                key={index}
                className="bg-white shadow-md rounded-lg p-4 relative"
              >
                <h4 className="text-md font-semibold mb-2 text-black">
                  {video.title || `Video ${index + 1}`}
                </h4>
                {isLocked ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <LockClosedIcon className="w-8 h-8 text-black" />
                  </div>
                ) : (
                  <video className="w-full h-auto" controls>
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ))
          ) : (
            <p className="text-black">No videos available.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {notes?.length > 0 ? (
            notes?.map((note, index) => (
              <div
                key={index}
                className="bg-white shadow-md rounded-lg p-4 relative"
              >
                <h4 className="text-md font-semibold mb-2 text-black">
                  {note?.title?.length > 15
                    ? `${note?.title.slice(0, 15)}...`
                    : note?.title || `Note ${index + 1}`}
                </h4>
                {isLocked ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <LockClosedIcon className="w-8 h-8 text-black" />
                  </div>
                ) : (
                  <a
                    href={note?.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black underline hover:text-gray-700"
                  >
                    Download Note
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="text-black">No notes available.</p>
          )}
        </div>
      )}
    </div>
  );
};

// Main AllClasses Component
// Main AllClasses Component
const AllClasses = ({ id }) => {
  const { courses, loading, error, fetchCourses } = useCourseContext(); // Destructure context values
  const { fetchUserProfile,profileData } = useUser(); // Access fetchUserProfile function from context
  const [selectedSubject, setSelectedSubject] = useState(null); // State to track selected subject
  const [selectedChapter, setSelectedChapter] = useState(null); // State to track selected chapter
  const [purchasedCourses, setPurchasedCourses] = useState([]); // Store user's purchased courses
  const course = courses?.find((course) => course._id === id); // Find the course by ID

  // FIX: Fetch data only once on mount, remove dependencies to prevent loops
  useEffect(() => {
    fetchCourses();
    if (!profileData) {
      fetchUserProfile();
    }
  }, []); // Empty dependency array to prevent excessive calls

    // Update purchasedCourses when profileData changes
    useEffect(() => {
      setPurchasedCourses(profileData?.purchasedCourses || []);
    }, [profileData]);


  // Check if the course is purchased
  const isCoursePurchased = purchasedCourses.some(
    (purchased) => purchased.course === id
  );

  // Loading or error state handling
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Handle subject click
  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject); // Set the clicked subject
    setSelectedChapter(null); // Reset the selected chapter
  };

  // Handle chapter click
  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter); // Set the clicked chapter
  };

  // Handle back to subjects
  const handleBackToSubjects = () => {
    setSelectedSubject(null); // Reset the selected subject
    setSelectedChapter(null); // Reset the selected chapter
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedChapter ? (
        <div>
          <button
            onClick={() => setSelectedChapter(null)}
            className="text-black underline text-xl mb-4 hover:text-gray-700"
          >
            Back to Chapters
          </button>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 capitalize">
            {selectedChapter.name} - Content
          </h2>
          <TabContent
            videos={selectedChapter.videos}
            notes={selectedChapter.notes}
            isLocked={!isCoursePurchased} // Pass lock status to TabContent
          />
        </div>
      ) : selectedSubject ? (
        <div>
          <button
            onClick={handleBackToSubjects}
            className="text-black underline text-xl mb-4 hover:text-gray-700"
          >
            Back to Subjects
          </button>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex gap-2 capitalize">
            {selectedSubject.name} - Chapters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {selectedSubject.chapters.map((chapter) => (
              <ChapterCard
                key={chapter._id}
                title={chapter.name}
                content={chapter.description || "Chapter content"}
                onClick={() => handleChapterClick(chapter)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Subjects</h2>
          <p className="text-gray-600 mb-8">
            Select your subject & start learning
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {course?.subjects?.map((subject) => (
              <SubjectCard
                key={subject._id}
                title={subject.name}
                chapters={subject.chapters?.length || 0}
                icon={<BookOpenIcon />}
                onClick={() => handleSubjectClick(subject)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllClasses;
