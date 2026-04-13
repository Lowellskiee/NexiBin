import { Head, router, usePage, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

const ITEMS_PER_PAGE = 5;

export default function ManageRewards() {
    const { rewards = [] } = usePage().props;
    const ITEMS_PER_PAGE = 5;

    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [preview, setPreview] = useState(null);
    const [pageInStock, setPageInStock] = useState(1);
    const [pageOutStock, setPageOutStock] = useState(1);

    // Desktop collapse
    const [openSections, setOpenSections] = useState({
        in: true,
        out: true,
    });

    // Mobile tabs + pagination
    const [activeTab, setActiveTab] = useState("in");
    const [pages, setPages] = useState({ in: 1, out: 1 });

    const toggleSection = (key) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const { data, setData, post, reset } = useForm({
        name: "",
        description: "",
        points_required: "",
        stock: "",
        image: null,
    });

    /* ================= FILTER ================= */

    const filtered = rewards.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    const grouped = {
        in: filtered.filter((r) => r.stock > 0),
        out: filtered.filter((r) => r.stock <= 0),
    };

    /* ================= ACTIONS ================= */

    const openCreate = () => {
        reset();
        setPreview(null);
        setEditing(null);
        setShowForm(true);
    };

    const openEdit = (reward) => {
        setEditing(reward);

        setData({
            name: reward.name,
            description: reward.description,
            points_required: reward.points_required,
            stock: reward.stock,
            image: null,
        });

        setPreview(reward.image_url || null);
        setShowForm(true);
    };

    const closeModal = () => {
        setShowForm(false);
        setPreview(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();

        if (editing) {
            post(route("admin.rewards.update", editing.id), {
                forceFormData: true,
                _method: "put",
                onSuccess: () => {
                    toast.success("Reward updated!");
                    closeModal();
                },
            });
        } else {
            post(route("admin.rewards.store"), {
                forceFormData: true,
                onSuccess: () => {
                    toast.success("Reward created!");
                    closeModal();
                },
            });
        }
    };

    const confirmDelete = () => {
        router.delete(route("admin.rewards.delete", deleteId), {
            onSuccess: () => {
                toast.success("Reward deleted!");
                setDeleteId(null);
            },
        });
    };

    /* ================= IMAGE ================= */

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement("canvas");

                const MAX_WIDTH = 800;
                const scale = MAX_WIDTH / img.width;

                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        const compressed = new File([blob], file.name, {
                            type: "image/jpeg",
                        });

                        setData("image", compressed);
                        setPreview(URL.createObjectURL(compressed));
                    },
                    "image/jpeg",
                    0.7
                );
            };
        };

        reader.readAsDataURL(file);
    };

    /* ================= MOBILE ================= */

    const currentList = grouped[activeTab];
    const currentPage = pages[activeTab];
    const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE);

    const paginated = currentList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToPage = (role, page) => {
        setPages((prev) => ({ ...prev, [role]: page }));
    };

    const renderMobileCards = () => {
        if (!paginated.length) {
            return (
                <p className="text-center text-gray-400 py-10 text-sm">
                    No rewards found.
                </p>
            );
        }

        return paginated.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl shadow border">
                <div className="flex justify-between">
                    <div>
                        <h3 className="font-semibold">{r.name}</h3>
                        <p className="text-xs text-gray-500">{r.description}</p>
                    </div>

                    <span
                        className={`text-xs px-2 py-1 rounded-full ${
                            r.stock > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {r.stock > 0 ? "In Stock" : "Out"}
                    </span>
                </div>

                <div className="mt-3 grid grid-cols-2 text-sm">
                    <div>
                        <p className="text-gray-400 text-xs">Points</p>
                        <p>{r.points_required}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Stock</p>
                        <p>{r.stock}</p>
                    </div>
                </div>

                <div className="flex gap-4 mt-4 border-t pt-2 text-sm">
                    <button onClick={() => openEdit(r)} className="text-yellow-600">
                        Edit
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="text-red-600">
                        Delete
                    </button>
                </div>
            </div>
        ));
    };

    /* ================= DESKTOP ================= */

    const renderSection = (title, key, list) => {
        if (!list.length) return null;

        return (
            <>
                <tr
                    className="bg-gray-100 cursor-pointer"
                    onClick={() => toggleSection(key)}
                >
                    <td colSpan="5" className="px-8 py-4 font-bold">
                        {openSections[key] ? "▼" : "▶"} {title} ({list.length})
                    </td>
                </tr>

                {openSections[key] &&
                    list.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-blue-50/40">
                            <td className="px-8 py-4">
                                <img
                                    src={r.image_url || "https://via.placeholder.com/50"}
                                    className="w-12 h-12 rounded object-cover mx-auto"
                                />
                            </td>
                            <td className="px-8 py-4 text-center">
                                <div className="font-medium">{r.name}</div>
                                <p className="text-xs text-gray-500">
                                    {r.description}
                                </p>
                            </td>
                            <td className="px-8 py-4 text-center">
                                {r.points_required}
                            </td>
                            <td className="px-8 py-4 text-center font-bold">
                                {r.stock}
                            </td>
                            <td className="px-8 py-4 text-center">
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => openEdit(r)}
                                        className="text-yellow-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(r.id)}
                                        className="text-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
            </>
        );
    };

    /* ================= RENDER ================= */

    return (
        <>
            <Head title="Manage Rewards" />
            <AdminLayout>
                <Toaster />

                {/* HEADER */}
                <div className="mb-6 flex justify-between">
                    <h2 className="text-2xl font-bold">Manage Rewards</h2>
                    <button
                        onClick={openCreate}
                        className="bg-yellow-400 px-5 py-2 rounded-lg"
                    >
                        + New Reward
                    </button>
                </div>

                {/* SEARCH */}
                <input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPages({ in: 1, out: 1 });
                    }}
                    className="border px-4 py-2 rounded mb-6 w-full sm:w-1/3"
                />

                {/* DESKTOP */}
                <div className="hidden md:block bg-white rounded-2xl shadow overflow-x-auto">
                    <table className="w-full text-base">
                        <thead className="bg-[#1B1F5E] text-white">
                            <tr>
                                <th className="px-8 py-4">Image</th>
                                <th>Name</th>
                                <th>Points</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderSection("IN STOCK", "in", grouped.in)}
                            {renderSection("OUT OF STOCK", "out", grouped.out)}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE */}
                <div className="md:hidden">
                    <div className="flex gap-2 mb-4">
                        {["in", "out"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`flex-1 py-2 rounded ${
                                    activeTab === t
                                        ? "bg-[#1B1F5E] text-white"
                                        : "bg-white border"
                                }`}
                            >
                                {t === "in" ? "In Stock" : "Out"}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">{renderMobileCards()}</div>
                </div>

                {/* MODAL */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-xl w-full max-w-lg">
                            <h3 className="mb-4 font-semibold">
                                {editing ? "Edit Reward" : "Create Reward"}
                            </h3>

                            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                                <input
                                    placeholder="Name"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="border p-2 rounded"
                                />

                                <input
                                    type="number"
                                    placeholder="Points"
                                    value={data.points_required}
                                    onChange={(e) =>
                                        setData("points_required", e.target.value)
                                    }
                                    className="border p-2 rounded"
                                />

                                <input
                                    type="number"
                                    placeholder="Stock"
                                    value={data.stock}
                                    onChange={(e) => setData("stock", e.target.value)}
                                    className="border p-2 rounded"
                                />

                                <label className="border p-2 rounded text-center cursor-pointer">
                                    Upload Image
                                    <input type="file" hidden onChange={handleFileChange} />
                                </label>

                                {preview && (
                                    <img
                                        src={preview}
                                        className="col-span-2 w-28 h-28 mx-auto rounded"
                                    />
                                )}

                                <textarea
                                    placeholder="Description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    className="border p-2 rounded col-span-2"
                                />

                                <div className="col-span-2 flex justify-end gap-2">
                                    <button type="button" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button className="bg-[#1B1F5E] text-white px-4 py-2 rounded">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE MODAL */}
                {deleteId && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl w-80 text-center">
                            <div className="text-red-500 text-3xl">⚠️</div>
                            <h3 className="font-semibold">Delete Reward?</h3>
                            <div className="flex justify-center gap-3 mt-4">
                                <button onClick={() => setDeleteId(null)}>
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="bg-red-600 text-white px-4 py-2 rounded"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AdminLayout>
        </>
    );
}