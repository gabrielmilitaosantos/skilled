import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SkillCard from "#/components/SkillCard.tsx";
import { getPopularTags } from "#/server/skills/queries/get-popular-tags.ts";
import {
	type SearchSkillsInput,
	searchSkills,
} from "#/server/skills/queries/search-skills.ts";

export const Route = createFileRoute("/skills/")({
	loader: async () => {
		const [initial, popularTags] = await Promise.all([
			searchSkills({ data: { sort: "newest", page: 1 } }),
			getPopularTags(),
		]);
		return { initial, popularTags };
	},
	staleTime: 30_000,
	component: SkillsPage,
});

type SortOption = "newest" | "oldest" | "alpha";

function SkillsPage() {
	const { initial, popularTags } = Route.useLoaderData();

	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [selectedTag, setSelectedTag] = useState<string | undefined>();
	const [tagInput, setTagInput] = useState("");
	const [sort, setSort] = useState<SortOption>("newest");
	const [page, setPage] = useState(1);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const filtersRef = useRef<HTMLDivElement>(null);

	// Debounce of 500ms in text search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
			setPage(1);
		}, 500);
		return () => clearTimeout(timer);
	}, [query]);

	// Close the filter dropdown by clicking outside.
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				filtersRef.current &&
				!filtersRef.current.contains(e.target as Node)
			) {
				setFiltersOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const searchInput: SearchSkillsInput = {
		query: debouncedQuery || undefined,
		tag: selectedTag,
		sort,
		page,
	};

	// Tanstack Query - takes control after the SSR.
	// initialData populates the cache with the loader's output to avoid an initial loading state.
	const { data, isFetching } = useQuery({
		queryKey: ["skills", searchInput],
		queryFn: () => searchSkills({ data: searchInput }),
		initialData:
			!debouncedQuery && !selectedTag && sort === "newest" && page === 1
				? initial
				: undefined,
		placeholderData: (prev) => prev,
	});

	const results = data ?? initial;

	const handleTagSelect = (tag: string) => {
		setSelectedTag((prev) => (prev === tag ? undefined : tag));
		setPage(1);
		setFiltersOpen(false);
	};

	const handleTagInputSearch = () => {
		if (tagInput.trim()) {
			setSelectedTag(tagInput.trim().toLowerCase());
			setTagInput("");
			setPage(1);
			setFiltersOpen(false);
		}
	};

	const handleSortChange = (value: SortOption) => {
		setSort(value);
		setPage(1);
	};

	const handleClearFilters = () => {
		setSelectedTag(undefined);
		setTagInput("");
		setSort("newest");
		setPage(1);
	};

	const hasActiveFilters = !!selectedTag || sort !== "newest";

	return (
		<div id="skills-page">
			<div className="intro">
				<h1>
					Explore <span className="text-gradient">Skills</span>
				</h1>
				<p>
					Browse, filter, and inspect reusable AI capabilities from a single
					registry.
				</p>
			</div>

			{/* Search + Filters bar */}
			<div className="search-bar">
				<div className="field">
					<Search size={16} className="icon" />
					<input
						type="text"
						className="input-field search-input"
						placeholder="Search skills by name, tag or author..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>

				<div className="filters-wrapper" ref={filtersRef}>
					<button
						type="button"
						className={`btn-secondary filters-btn ${hasActiveFilters ? "filters-btn-active" : ""}`}
						onClick={() => setFiltersOpen((prev) => !prev)}
						aria-expanded={filtersOpen}
						aria-haspopup="true"
					>
						<Filter size={14} />
						<span>Filters</span>
						{hasActiveFilters && <span className="filters-badge" />}
					</button>

					{filtersOpen && (
						<div className="filters-dropdown" role="dialog">
							{/* Sort */}
							<div className="filter-section">
								<p className="filter-section-label">Sort by</p>
								<div className="filter-options">
									{(["newest", "oldest", "alpha"] as SortOption[]).map(
										(option) => (
											<button
												key={option}
												type="button"
												className={`filter-option ${sort === option ? "filter-option-active" : ""}`}
												onClick={() => handleSortChange(option)}
											>
												{option === "newest" && "Newest first"}
												{option === "oldest" && "Oldest first"}
												{option === "alpha" && "Alphabetical (A-Z)"}
											</button>
										),
									)}
								</div>
							</div>

							{/* Popular Tags */}
							<div className="filter-section">
								<p className="filter-section-label">Popular Tags</p>
								<div className="filter-tags">
									{popularTags.map((tag) => (
										<button
											key={tag.tag}
											type="button"
											className={`tag-chip ${selectedTag === tag.tag ? "tag-chip-active" : ""}`}
											onClick={() => handleTagSelect(tag.tag)}
										>
											{tag.tag}
										</button>
									))}
								</div>
							</div>

							{/* Input to search other tags */}
							<div className="filter-section">
								<p className="filter-section-label">Search by tag</p>
								<div className="filter-tag-input">
									<input
										type="text"
										className="input-field input-field-sm"
										placeholder="e.g ai-agent"
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										onKeyDown={(e) =>
											e.key === "Enter" && handleTagInputSearch()
										}
									/>
									<button
										type="button"
										className="btn-secondary"
										onClick={handleTagInputSearch}
									>
										Apply
									</button>
								</div>
							</div>

							{hasActiveFilters && (
								<button
									type="button"
									className="filter-clear"
									onClick={handleClearFilters}
								>
									Clear filters
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Active filter */}
			{selectedTag && (
				<div className="active-filter">
					<span>
						Tag: <strong>{selectedTag}</strong>
					</span>
					<button
						type="button"
						onClick={() => {
							setSelectedTag(undefined);
							setPage(1);
						}}
						aria-label="Remove tag filter"
					>
						×
					</button>
				</div>
			)}

			{/* Counter */}
			<p className="skills-count">
				{isFetching
					? "Loading..."
					: `${results.total} skill${results.total !== 1 ? "s" : ""} found`}
			</p>

			{/* Grid */}
			<div className={`skills-content ${isFetching ? "skills-fetching" : ""}`}>
				{results.skills.length > 0 ? (
					<div className="skills-grid">
						{results.skills.map((skill) => (
							<SkillCard key={skill.id} {...skill} />
						))}
					</div>
				) : (
					<div className="skills-empty">
						<p>No skills found for your search.</p>
						{hasActiveFilters && (
							<button
								type="button"
								className="btn-secondary"
								onClick={handleClearFilters}
							>
								Clear filters
							</button>
						)}
					</div>
				)}
			</div>

			{/* Pagination */}
			{results.totalPages > 1 && (
				<div className="pagination">
					<button
						type="button"
						className="pagination-btn"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1 || isFetching}
						aria-label="Previous Page"
					>
						<ChevronLeft size={16} />
					</button>

					{Array.from({ length: results.totalPages }, (_, i) => i + 1).map(
						(p) => (
							<button
								key={p}
								type="button"
								className={`pagination-page ${p === page ? "pagination-page-active" : ""}`}
								onClick={() => setPage(p)}
								disabled={isFetching}
							>
								{p}
							</button>
						),
					)}

					<button
						type="button"
						className="pagination-btn"
						onClick={() => setPage((p) => Math.min(results.totalPages, p + 1))}
						disabled={page === results.totalPages || isFetching}
						aria-label="Next page"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			)}
		</div>
	);
}
