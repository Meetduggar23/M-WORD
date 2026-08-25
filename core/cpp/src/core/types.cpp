#include "quill/core/types.h"
#include <atomic>

namespace quill {

static std::atomic<ElementId> s_nextId(1);

ElementId generateId() {
    return s_nextId.fetch_add(1, std::memory_order_relaxed);
}

} // namespace quill
