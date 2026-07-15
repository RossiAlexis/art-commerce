import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PaintingEditorView } from './paintings-editor-view'
import type { EditablePainting } from './paintings-editor'

const categories = [
  { id: 'cat-1', name: 'Landscapes' },
  { id: 'cat-2', name: 'Portraits' },
]

const painting: EditablePainting = {
  id: 'p-1',
  title: 'Sunset',
  price: 'CAD 1,200',
  measures: '30 x 40 cm',
  categoryId: 'cat-1',
  content: 'A warm evening.',
  images: [{ id: 'img-1', altText: 'front', order: 0 }],
}

describe('PaintingEditorView', () => {
  it('renders all five managed fields with the Category options in create mode', () => {
    const markup = renderToStaticMarkup(
      <PaintingEditorView
        mode="create"
        username="vero"
        painting={null}
        categories={categories}
        status={{ kind: 'idle' }}
      />,
    )

    expect(markup).toContain('New painting')
    expect(markup).toContain('name="title"')
    expect(markup).toContain('name="price"')
    expect(markup).toContain('name="measures"')
    expect(markup).toContain('name="categoryId"')
    expect(markup).toContain('name="content"')
    expect(markup).toContain('Landscapes')
    expect(markup).toContain('Portraits')
    // The image manager is unavailable until the Painting exists.
    expect(markup).not.toContain('Add image')
  })

  it('shows the image manager and prefilled fields in edit mode', () => {
    const markup = renderToStaticMarkup(
      <PaintingEditorView
        mode="edit"
        username="vero"
        painting={painting}
        categories={categories}
        status={{ kind: 'idle' }}
        imageCallbacks={{
          onAddImage: () => {},
          onReplaceImage: () => {},
          onDescribeImage: () => {},
          onRemoveImage: () => {},
          onMoveImage: () => {},
        }}
      />,
    )

    expect(markup).toContain('Edit Sunset')
    expect(markup).toContain('value="CAD 1,200"')
    expect(markup).toContain('/resources/note-images/img-1')
    expect(markup).toContain('Add image')
    expect(markup).toContain('Replace image')
  })

  it('warns that an image-less Painting is hidden from public pages', () => {
    const markup = renderToStaticMarkup(
      <PaintingEditorView
        mode="edit"
        username="vero"
        painting={{ ...painting, images: [] }}
        categories={categories}
        status={{ kind: 'idle' }}
        imageCallbacks={{
          onAddImage: () => {},
          onReplaceImage: () => {},
          onDescribeImage: () => {},
          onRemoveImage: () => {},
          onMoveImage: () => {},
        }}
      />,
    )

    expect(markup).toContain('off the')
    expect(markup).toContain('gallery')
  })

  it('renders per-field validation errors and a status banner', () => {
    const markup = renderToStaticMarkup(
      <PaintingEditorView
        mode="create"
        username="vero"
        painting={null}
        categories={categories}
        fieldErrors={{ title: 'A title is required.' }}
        status={{ kind: 'error', message: 'Something went wrong.' }}
      />,
    )

    expect(markup).toContain('A title is required.')
    expect(markup).toContain('Something went wrong.')
  })
})
