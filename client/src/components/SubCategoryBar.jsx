import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import API from "../api";
import "./SubCategoryBar.css";

const SubCategoryBar = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const pathParts = location.pathname.split("/");
  const categoryIndex = pathParts.indexOf("category");
  const categoryName = categoryIndex !== -1 ? decodeURIComponent(pathParts[categoryIndex + 1] || "") : null;
  const activeSub = searchParams.get("sub") || "";
  const showCategoryBar = useMemo(
    () =>
      location.pathname === "/" ||
      location.pathname === "/shop" ||
      location.pathname.startsWith("/shop/category/") ||
      location.pathname.startsWith("/product/"),
    [location.pathname]
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await API.get("/categories");
        const categoryList = Array.isArray(data) ? data : data.categories || [];
        setCategories(categoryList);

        if (!categoryName) {
          setSubCategories([]);
          return;
        }

        const currentCat = categoryList.find((c) => c.name?.toLowerCase() === categoryName.toLowerCase());
        setSubCategories(Array.isArray(currentCat?.subCategories) ? currentCat.subCategories : []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
        setSubCategories([]);
      }
    };

    if (showCategoryBar) {
      fetchCategories();
    }
  }, [categoryName, showCategoryBar]);

  if (!showCategoryBar || categories.length === 0) return null;

  const handleSubClick = (sub) => {
    const newParams = new URLSearchParams(searchParams);
    if (activeSub === sub) {
      newParams.delete("sub");
    } else {
      newParams.set("sub", sub);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="sub-category-bar-wrapper">
      <div className="container">
        <div className="sub-category-bar shadow-sm">
          <div className="sub-category-list">
            {categories.map((category) => {
              const name = category.name || "";
              const isActive = categoryName?.toLowerCase() === name.toLowerCase();
              return (
                <Link
                  key={category._id || name}
                  to={`/shop/category/${encodeURIComponent(name)}`}
                  className={`sub-category-item sub-category-link ${isActive ? "active" : ""}`}
                >
                  {name}
                </Link>
              );
            })}
          </div>

          {categoryName && subCategories.length > 0 && (
            <div className="sub-category-list sub-category-list-secondary">
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  className={`sub-category-item ${activeSub === sub ? "active" : ""}`}
                  onClick={() => handleSubClick(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubCategoryBar;
