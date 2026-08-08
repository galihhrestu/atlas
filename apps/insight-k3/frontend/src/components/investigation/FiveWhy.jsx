function FiveWhy({ items = [], onChange, readOnly = false }) {
  const updateItem = (index, field, value) => {
    const updated = items.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }

      return {
        ...item,
        [field]: value
      };
    });

    onChange(updated);
  };

  return (
    <div className="investigation-card">
      <h2 className="investigation-title">Five Why Analysis</h2>
      <p className="section-helper">
        Gunakan pertanyaan berurutan untuk menelusuri penyebab sampai akar masalah.
      </p>

      <div className="five-why-list">
        {items.map((item, index) => (
          <div className="five-why-item" key={item.id || index}>
            <div className="why-number">{index + 1}</div>

            <div className="five-why-fields">
              <label>Question</label>
              <input
                value={item.question}
                disabled={readOnly}
                onChange={(event) =>
                  updateItem(index, "question", event.target.value)
                }
              />

              <label>Answer</label>
              <textarea
                value={item.answer}
                disabled={readOnly}
                onChange={(event) =>
                  updateItem(index, "answer", event.target.value)
                }
                placeholder={`Jawaban untuk Why ${index + 1}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FiveWhy;
