import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Button from '../atoms/Button';

// Array of note categories
const categories = ['work', 'personal', 'study']; 

const DashboardNotes = () => {

    // Initialize state variables for notes, loading status, error, search query, filtered notes,
    // selected category, sort order, editing status, current note, and form values
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [isEditing, setIsEditing] = useState(false);
    const [currentNote, setCurrentNote] = useState(null);
    const [formValues, setFormValues] = useState({ title: '', text: '', category: '' });

    // Get the currentUser from the Redux store
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        // Function to fetch notes from the database
        const fetchNotes = async () => {

            // Check if a user is logged in and display an error message if not
            if (!currentUser) {
                setError('No user is logged in');
                setLoading(false);
                return;
            }

            try {
                // Query the notes collection for notes created by the current user 
                // and store the result in notesList state variable 
                const notesQuery = query(
                    collection(db, 'notes'), // Reference to the notes collection
                    where('user', '==', currentUser.email) // Filter notes by the current user's email
                );
                // Get the notes from the database and store them in the notesList state variable
                const querySnapshot = await getDocs(notesQuery);
                const notesList = querySnapshot.docs.map(doc => ({
                    id: doc.id, // Store the note ID
                    ...doc.data() // Spread the note data into a new object
                }));
                // Update the notes and filteredNotes state variables with the notesList
                setNotes(notesList);
                setFilteredNotes(notesList);
            } catch (err) {
                setError('Error fetching notes: ' + err.message); // Display an error message
            } finally {
                setLoading(false); // Set loading to false when the operation is complete
            }
        };

        fetchNotes();
    }, [currentUser]);

    useEffect(() => {
        // Function to filter notes based on search query, selected category, and sort order
        const filterNotes = () => {
            let filtered = notes;
            // Filter notes based on the search query
            if (searchQuery) {
                const lowercasedQuery = searchQuery.toLowerCase();
                filtered = filtered.filter(note =>
                    note.title.toLowerCase().includes(lowercasedQuery) ||
                    note.text.toLowerCase().includes(lowercasedQuery) ||
                    note.category.toLowerCase().includes(lowercasedQuery)
                );
            }

            // Filter notes based on the selected category
            if (selectedCategory) {
                filtered = filtered.filter(note => note.category === selectedCategory);
            }

            // Sort notes based on the sort order
            if (sortOrder === 'newest') {
                filtered = filtered.sort((a, b) => b.date.seconds - a.date.seconds);
            } else if (sortOrder === 'oldest') {
                filtered = filtered.sort((a, b) => a.date.seconds - b.date.seconds);
            }
            setFilteredNotes(filtered); // Update the filteredNotes state variable
        };

        filterNotes();
    }, [searchQuery, selectedCategory, sortOrder, notes]);


    // Function to delete a note from the database
    const handleDelete = async (noteId) => {
        try {
            // Delete the note with the specified ID from the notes collection
            await deleteDoc(doc(db, 'notes', noteId));

            // Update the notes and filteredNotes state variables by removing the deleted note
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

            // Update the filteredNotes state variable by removing the deleted note
            setFilteredNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            toast.success('Note deleted successfully!'); // Display success message
        } catch (err) {
            toast.error('Error deleting note: ' + err.message); // Display error message
        }
    };

    // Function to handle editing a note
    const handleEdit = (note) => {

        // Set the current note and form values to the note being edited
        setCurrentNote(note);

        // Set the form values to the note being edited to populate the form fields
        setFormValues({ title: note.title, text: note.text, category: note.category });
        setIsEditing(true); // Set editing to true to display the edit form
    };

    // Function to update a note in the database
    const handleUpdate = async (e) => {
        e.preventDefault();

        // Check if the title and text fields are not empty
        if (!formValues.title || !formValues.text) {
            toast.error('Please fill in all fields.');
            return;
        }

        try {
            // Update the note with the specified ID in the notes collection with the new form values
            await updateDoc(doc(db, 'notes', currentNote.id), formValues);

            // Update the notes and filteredNotes state variables with the updated note
            setNotes(prevNotes => prevNotes.map(note =>
                note.id === currentNote.id ? { ...note, ...formValues } : note
            ));
            setFilteredNotes(prevNotes => prevNotes.map(note =>
                note.id === currentNote.id ? { ...note, ...formValues } : note
            ));

            toast.success('Note updated successfully!'); // Display success message
            setIsEditing(false); // Set editing to false to hide the edit form
            setCurrentNote(null); // Reset the current note
        } catch (err) {
            toast.error('Error updating note: ' + err.message); // Display error message
        }
    };

    // Function to handle form input changes for the edit form fields 
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prevValues => ({
            ...prevValues,
            [name]: value
        }));
    };

    return (
        <div className="p-4 bg-gray-100">

            {/* Display loading message if notes are still loading */}
            {loading && <p>Loading...</p>}
            {/* Display error message if there was an error fetching notes */}
            {error && <p className="text-red-500">{error}</p>}

            {/* Display notes if they are available and not loading */}
            {!loading && !error && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border w-full border-gray-300 rounded-md"
                        />
                        <select
                            name="category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                            ))}
                        </select>
                        <select
                            name="sort"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>

                    {/* Display the edit form if isEditing is true, otherwise display the notes */}
                    {isEditing ? (
                        <div className="max-w-md mx-auto mt-2 md:mt-10 bg-white p-6 rounded-lg shadow-lg mb-6">
                            <h2 className="text-xl font-bold mb-4">Edit Note</h2>
                            <form onSubmit={handleUpdate}>
                                <select
                                    name="category"
                                    value={formValues.category}
                                    onChange={handleInputChange}
                                    className="p-2 border border-gray-300 rounded-md mb-4 w-full"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    name="title"
                                    value={formValues.title}
                                    onChange={handleInputChange}
                                    placeholder="Title"
                                    className="p-2 border border-gray-300 rounded-md mb-4 w-full"
                                />
                                <textarea
                                    name="text"
                                    value={formValues.text}
                                    onChange={handleInputChange}
                                    placeholder="Text"
                                    className="p-2 border border-gray-300 rounded-md mb-4 w-full"
                                    rows="4"
                                />

                                <Button
                                    type="submit"
                                    content="Update"
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                />
                            </form>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-xl font-bold mb-4">My Notes</h1>

                            {/* Display notes if there are notes available, otherwise display a message */}
                            {filteredNotes.length === 0 ? (
                                <p>No notes available</p>
                            ) : (
                                <ul>
                                    {filteredNotes.map(note => (
                                        <li key={note.id} className="mb-4 p-4 border border-gray-200 rounded-md">
                                            <h2 className="text-lg font-semibold">{note.title}</h2>
                                            <p className="mt-2">{note.text}</p>
                                            <p className="mt-2 text-sm text-gray-500">Category: {note.category}</p>
                                            <p className="mt-2 text-sm text-gray-500">Date: {new Date(note.date.seconds * 1000).toLocaleString()}</p>
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleEdit(note)}
                                                    className="mt-2 bg-blue-500 hover:!bg-blue-500 rounded-md"
                                                    content="Edit"
                                                />
                                                <Button
                                                    onClick={() => handleDelete(note.id)}
                                                    className="mt-2 bg-red-500 hover:!bg-red-500 rounded-md"
                                                    content="Delete"
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardNotes;
