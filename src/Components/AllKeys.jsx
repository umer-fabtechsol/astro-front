import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import * as XLSX from "xlsx/xlsx";
import { toast } from "react-toastify";
import { Table } from "react-bootstrap";
import useApi from "../hooks/useApi";

const AllKeys = () => {
  const [keys, setKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("");
  const [active, setActive] = useState("all");
  const [status, setStatus] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [products, setProducts] = useState();
  const [flavour, setFlavour] = useState();
  const [loading, setLoading] = useState(false);
  const [checkedId, setCheckedId] = useState([]);
  const [batches, setbatches] = useState([]);

  const fetchKeys = async (
    page = currentPage,
    sort = "",
    status = "",
    flavour = "",
    batch = ""
  ) => {
    setLoading(true);
    const res = await apiClient.get(
      `/codes?page=${page}&sort=${sort}&status=${status}&flavour=${flavour}&batch=${batch}`
    );
    if (res.status === 200) {
      setLoading(false);
      setKeys(res.data.keys);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const res = await apiClient.get("/product");
    if (res.status === 200) {
      setProducts(res.data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchProducts();
  }, []);

  const handleStatus = (value) => {
    setStatus(value);
    fetchKeys(1, sort, value, flavour);
  };

  const handlePageChange = (value) => {
    setCurrentPage(value);
    fetchKeys(value, sort, status, flavour);
  };

  const handleDelete = async (id) => {
    try {
      if (id.length === 1) {
        const response = await apiClient.delete(`/codes/${id}`);
        if (!response.status === 200) {
          throw new Error(response.statusText);
        }
        if (response.status == 200) {
          fetchKeys();
        }
      } else {
        const response = await apiClient.post("/codes/delete-bulk", {
          data: id,
        });
        if (response.status === 200) {
          fetchKeys();
        } else {
          throw new Error(response.statusText);
        }
      }
    } catch (error) {
      toast.error(error);
    }
  };

  const exportAll = async () => {
    const allKeys = await apiClient.get("/codes/all");
    if (allKeys.status === 200) {
      const data = [["Index", "Verification Code", "Batch ID"]];
      allKeys?.data?.forEach((code, index) => {
        const rowData = [index + 1, code.key, code.batchId.BatchID];
        data.push(rowData);
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Verification Codes");
      XLSX.writeFile(wb, "verification_codes.xlsx");
    }
  };

  const exportCodes = () => {
    const data = [["Index", "Verification Code", "Batch ID"]];
    keys?.forEach((code, index) => {
      const rowData = [index + 1, code.key, code.batchId.BatchID];
      data.push(rowData);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Verification Codes");
    XLSX.writeFile(wb, "verification_codes.xlsx");
  };
  const renderTableRows = () => {
    return keys.map((key, index) => {
      const originalIndex = index;
      index = (currentPage - 1) * pageSize + originalIndex + 1;

      const handleCheckboxChange = (id) => {
        if (checkedId.includes(id)) {
          setCheckedId(checkedId.filter((itemId) => itemId !== id));
        } else {
          setCheckedId([...checkedId, id]);
        }
      };

      const isChecked = checkedId.includes(key._id);

      return (
        <tr key={key._id}>
          <td>
            {!key.activated && (
              <input
                type="checkbox"
                checked={isChecked}
                disabled={key.activated}
                onChange={() => handleCheckboxChange(key._id)}
              />
            )}
          </td>
          <td>{index}</td>
          <td>{key.key}</td>
          <td>{key.batchId.BatchID}</td>
          <td>
            {key.activated ? new Date(key.activated).toLocaleString() : "N/A"}
          </td>
          <td>
            {!key.activated && (
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(key._id)}
              >
                Delete
              </button>
            )}
          </td>
        </tr>
      );
    });
  };

  const renderPagination = () => {
    const maxButtons = 10;
    const sideButtons = 2;
    const ellipsisThreshold = maxButtons - sideButtons * 2 - 1;

    const pages = [];
    let startPage, endPage;

    if (totalPages <= maxButtons) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= sideButtons + 1) {
        startPage = 1;
        endPage = maxButtons;
      } else if (currentPage >= totalPages - sideButtons) {
        startPage = totalPages - maxButtons + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - sideButtons;
        endPage = currentPage + sideButtons;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li
          key={i}
          className={`page-item${currentPage === i ? " active" : ""}`}
        >
          <a href="#" className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </a>
        </li>
      );
    }

    if (totalPages > maxButtons && endPage < totalPages - 1) {
      pages.push(
        <li key="ellipsis-next" className="page-item disabled">
          <span className="page-link">...</span>
        </li>
      );
      pages.push(
        <li key={totalPages} className="page-item">
          <a
            href="#"
            className="page-link"
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </a>
        </li>
      );
    }

    return (
      <nav aria-label="Page navigation example">
        <ul className="pagination">
          <li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
            <a
              href="#"
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </a>
          </li>
          {pages}
          <li
            className={`page-item${
              currentPage === totalPages ? " disabled" : ""
            }`}
          >
            <a
              href="#"
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </a>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="container">
      <h2 className="text-center fs-1 mb-3">
        <b>Product Keys</b>
      </h2>
      <div className="d-flex align-items-center justify-content-center">
        <div className="text-center mb-4">
          <button
            className={` btn  py-2 mx-2 px-4 border border-primary ${
              active === "all" ? "active text-light" : "text-primary"
            }`}
            onClick={() => {
              handleStatus("");
              setActive("all");
            }}
          >
            <b>All</b>
          </button>
          <button
            className={` btn  py-2 mx-2 px-4 border border-primary ${
              active === "activated" ? "active text-light" : "text-primary"
            }`}
            onClick={() => {
              handleStatus("activated");
              setActive("activated");
            }}
          >
            <b>Activated</b>
          </button>
          <button
            className={` btn  py-2 mx-2 px-4 border border-primary ${
              active === "unactivated" ? "active text-light" : "text-primary"
            }`}
            onClick={() => {
              handleStatus("unactivated");
              setActive("unactivated");
            }}
          >
            <b> Unactivated</b>
          </button>
          {checkedId.length ? (
            <button
              className={` btn  py-2 mx-2 px-4 border border-primary ${
                active === "unactivated" ? "active text-light" : "text-primary"
              }`}
              onClick={() => {
                handleDelete(checkedId);
                setActive("Delete_Selected");
              }}
            >
              <b> Delete Selected</b>
            </button>
          ) : (
            ""
          )}
          <select
            className="btn text-primary py-2 mx-2 px-4 border border-primary"
            aria-label="Default select example"
            onChange={(e) => {
              if (e.target.value === "currentPage") {
                exportCodes();
              } else if (e.target.value === "all") {
                exportAll();
              }
            }}
          >
            <option value="currentPage">Export this page only</option>
            <option value="all">Export all</option>
          </select>
        </div>
      </div>
      {products && (
        <select
          class="form-select border border-primary mb-2"
          aria-label="Default select example"
          placeholder="Filter By flavour"
          onChange={(e) => {
            const code = e.target.value;
            fetchKeys(1, "", "", code);
            setFlavour(code);
          }}
          defaultValue="" // Add defaultValue with an empty value
        >
          <option value="">Select a flavour</option> {/* Add an empty option */}
          {products.map((data, index) => (
            <option value={data.code}>{data?.name}</option>
          ))}
        </select>
      )}

      {flavour && (
        <select
          className="form-select border border-primary mb-2"
          aria-label="Default select example"
          placeholder="Filter By Batches"
          onChange={(e) => {
            const batch = e.target.value;
            fetchKeys(1, "", "", "", batch);
          }}
        >
          {products.find((data) => data.code === flavour)?.batches?.length >
          0 ? (
            products
              .find((data) => data.code === flavour)
              ?.batches.map((el) => (
                <option key={el?.BatchID} value={el?.BatchID}>
                  {el?.BatchID}
                </option>
              ))
          ) : (
            <option value="">No Batches Available</option>
          )}
        </select>
      )}

      {loading && (
        <div className="d-flex align-items-center justify-content-center">
          <span class="spinner-border" role="status">
            <span class="sr-only"></span>
          </span>
        </div>
      )}
      <Table variant="light" striped bordered hover>
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">#</th>
            <th scope="col">Key</th>
            <th scope="col">Batch ID</th>
            <th scope="col">Activated</th>
            <th scope="col">Delete</th>
          </tr>
        </thead>
        <tbody>{renderTableRows()}</tbody>
      </Table>
      {renderPagination()}
    </div>
  );
};

export default AllKeys;
