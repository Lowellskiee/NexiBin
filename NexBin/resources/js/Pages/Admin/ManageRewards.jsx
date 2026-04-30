import { Head, router, usePage, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const ITEMS_PER_PAGE = 5;

export default function ManageRewards() {
    const { rewards = [] } = usePage().props;

    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [preview, setPreview] = useState(null);
    const [activeTab, setActiveTab] = useState("in");
    const [pages, setPages] = useState({ in: 1, out: 1 });
    const [openSections, setOpenSections] = useState({ in: true, out: true });

    const { data, setData, post, reset } = useForm({
        name: "",
        description: "",
        points_required: "",
        stock: "",
        image: null,
    });

    /* ── Filter & group ── */
    const filtered = rewards.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );
    const grouped = {
        in:  filtered.filter((r) => r.stock > 0),
        out: filtered.filter((r) => r.stock <= 0),
    };

    /* ── Actions ── */
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
                onSuccess: () => { toast.success("Reward updated!"); closeModal(); },
            });
        } else {
            post(route("admin.rewards.store"), {
                forceFormData: true,
                onSuccess: () => { toast.success("Reward created!"); closeModal(); },
            });
        }
    };

    const confirmDelete = () => {
        router.delete(route("admin.rewards.delete", deleteId), {
            onSuccess: () => { toast.success("Reward deleted!"); setDeleteId(null); },
        });
    };

    /* ── Image compression ── */
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
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    const compressed = new File([blob], file.name, { type: "image/jpeg" });
                    setData("image", compressed);
                    setPreview(URL.createObjectURL(compressed));
                }, "image/jpeg", 0.7);
            };
        };
        reader.readAsDataURL(file);
    };

    /* ── Mobile pagination ── */
    const currentList  = grouped[activeTab];
    const currentPage  = pages[activeTab];
    const totalPages   = Math.ceil(currentList.length / ITEMS_PER_PAGE);
    const paginated    = currentList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const goToPage = (role, page) => setPages((prev) => ({ ...prev, [role]: page }));

    /* ── Desktop section rows ── */
    const renderSection = (title, key, list) => {
        if (!list.length) return null;
        return (
            <>
                <tr
                    className="bg-gray-100 cursor-pointer select-none"
                    onClick={() => setOpenSections((p) => ({ ...p, [key]: !p[key] }))}
                >
                    <td colSpan="5" className="px-8 py-4 font-bold text-sm">
                        {openSections[key] ? "▼" : "▶"} {title} ({list.length})
                    </td>
                </tr>
                {openSections[key] && list.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-blue-50/40 transition-colors">
                        <td className="px-8 py-4">
                            <img
                                src={r.image_url || "https://via.placeholder.com/50"}
                                className="w-12 h-12 rounded-lg object-cover mx-auto"
                                alt={r.name}
                            />
                        </td>
                        <td className="px-8 py-4 text-center">
                            <div className="font-medium">{r.name}</div>
                            <p className="text-xs text-gray-500">{r.description}</p>
                        </td>
                        <td className="px-8 py-4 text-center">{r.points_required}</td>
                        <td className="px-8 py-4 text-center font-bold">{r.stock}</td>
                        <td className="px-8 py-4 text-center">
                            <div className="flex justify-center gap-4 text-sm">
                                <button onClick={() => openEdit(r)} className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors">Edit</button>
                                <button onClick={() => setDeleteId(r.id)} className="text-red-600 hover:text-red-700 font-medium transition-colors">Delete</button>
                            </div>
                        </td>
                    </tr>
                ))}
            </>
        );
    };

    /* ── Mobile cards ── */
    const renderMobileCards = () => {
        if (!paginated.length) return (
            <p className="text-center text-gray-400 py-10 text-sm">No rewards found.</p>
        );
        return paginated.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                    <img
                        src={r.image_url || "https://via.placeholder.com/50"}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        alt={r.name}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-800 truncate">{r.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${r.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {r.stock > 0 ? "In Stock" : "Out"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                        <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                            <span><span className="font-medium text-gray-700">{r.points_required}</span> pts</span>
                            <span><span className="font-medium text-gray-700">{r.stock}</span> stock</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
                    <button
                        onClick={() => openEdit(r)}
                        className="flex-1 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setDeleteId(r.id)}
                        className="flex-1 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ));
    };

    /* ── Shared input class ── */
    const inputCls = "w-full border border-gray-200 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E] transition-colors placeholder:text-gray-400";

    /* ── Render ── */
    return (
        <>
            <Head title="Manage Rewards" />
            <AdminLayout>
                <Toaster position="top-right" />

                {/* Header */}
                <div className="mb-6 flex items-center justify-between gap-3">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Manage Rewards</h2>
                    <button
                        onClick={openCreate}
                        className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                    >
                        <span className="text-lg leading-none">+</span> New Reward
                    </button>
                </div>

                {/* Search */}
                <input
                    placeholder="Search rewards..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPages({ in: 1, out: 1 }); }}
                    className="border border-gray-200 px-4 py-2.5 rounded-xl mb-6 w-full sm:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E] transition-colors"
                />

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-x-auto border border-gray-100">
                    <table className="w-full text-sm">
                        <thead className="bg-[#1B1F5E] text-white">
                            <tr>
                                <th className="px-8 py-4 font-semibold">Image</th>
                                <th className="px-8 py-4 font-semibold">Name</th>
                                <th className="px-8 py-4 font-semibold">Points</th>
                                <th className="px-8 py-4 font-semibold">Stock</th>
                                <th className="px-8 py-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderSection("IN STOCK", "in", grouped.in)}
                            {renderSection("OUT OF STOCK", "out", grouped.out)}
                            {!grouped.in.length && !grouped.out.length && (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 text-sm">No rewards found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile tabs + cards */}
                <div className="md:hidden">
                    <div className="flex gap-2 mb-4">
                        {[["in", "In Stock"], ["out", "Out of Stock"]].map(([t, label]) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                    activeTab === t ? "bg-[#1B1F5E] text-white" : "bg-white border border-gray-200 text-gray-600"
                                }`}
                            >
                                {label}
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t ? "bg-white/20" : "bg-gray-100"}`}>
                                    {grouped[t].length}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="space-y-3">{renderMobileCards()}</div>

                    {/* Mobile pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-5">
                            <button
                                onClick={() => goToPage(activeTab, currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
                            >
                                ←
                            </button>
                            <span className="text-sm text-gray-600">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => goToPage(activeTab, currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>

                {/* ── CREATE / EDIT MODAL ── */}
                {showForm && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={closeModal}
                    >
                        <div
                            className="
                                bg-white w-full sm:max-w-lg
                                rounded-t-2xl sm:rounded-2xl
                                max-h-[92vh] sm:max-h-[90vh]
                                flex flex-col
                                shadow-xl
                            "
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                                {/* Mobile drag handle */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full sm:hidden" />

                                <h3 className="font-bold text-gray-800 text-base">
                                    {editing ? "Edit Reward" : "Create Reward"}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Scrollable form body */}
                            <div className="overflow-y-auto flex-1 px-5 py-4">
                                <form id="reward-form" onSubmit={submit} className="space-y-3">

                                    {/* Name + Points: side-by-side on sm+, stacked on mobile */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                                Reward Name
                                            </label>
                                            <input
                                                placeholder="e.g. Eco Tote Bag"
                                                value={data.name}
                                                onChange={(e) => setData("name", e.target.value)}
                                                className={inputCls}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                                Points Required
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 100"
                                                value={data.points_required}
                                                onChange={(e) => setData("points_required", e.target.value)}
                                                className={inputCls}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Stock */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                            Stock Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 50"
                                            value={data.stock}
                                            onChange={(e) => setData("stock", e.target.value)}
                                            className={inputCls}
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                            Description
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Short description of the reward..."
                                            value={data.description}
                                            onChange={(e) => setData("description", e.target.value)}
                                            className={`${inputCls} resize-none`}
                                        />
                                    </div>

                                    {/* Image upload + preview */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                            Image
                                        </label>
                                        <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 hover:border-[#1B1F5E]/40 rounded-xl py-4 cursor-pointer transition-colors group">
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-[#1B1F5E]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm text-gray-500 group-hover:text-[#1B1F5E]/70">
                                                {preview ? "Change image" : "Upload image"}
                                            </span>
                                            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                                        </label>

                                        {preview && (
                                            <div className="mt-3 flex justify-center">
                                                <div className="relative inline-block">
                                                    <img
                                                        src={preview}
                                                        alt="Preview"
                                                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover border border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setPreview(null); setData("image", null); }}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </form>
                            </div>

                            {/* Modal footer — sticky at bottom */}
                            <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
                                {/* Mobile: stacked; sm+: side by side */}
                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="reward-form"
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1B1F5E] hover:bg-[#252a7a] text-white text-sm font-semibold transition-colors"
                                    >
                                        {editing ? "Save Changes" : "Create Reward"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DELETE CONFIRM MODAL ── */}
                {deleteId && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={() => setDeleteId(null)}
                    >
                        <div
                            className="bg-white w-full sm:w-80 rounded-t-2xl sm:rounded-2xl shadow-xl p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Mobile drag handle */}
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

                            <div className="text-center">
                                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-gray-800 text-base mb-1">Delete Reward?</h3>
                                <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
                                <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </AdminLayout>
        </>
    );
}
